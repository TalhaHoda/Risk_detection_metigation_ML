from fastapi import FastAPI, Request, HTTPException, status
import tensorflow as tf
import numpy as np
import json
import logging
import sys
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional

app = FastAPI()
executor = ThreadPoolExecutor()

# Global variables for the base model and feature order
# This model now serves as a general anomaly detector for UNKNOWN patterns.
model = None
feature_order = None
num_classes = 2 # Assuming 2 classes (normal/anomaly)
model_path = "initial_lstm_model.h5"
feature_order_path = "feature_order.json"

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Set the logging level
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)  # Output to console
    ]
)

@app.on_event("startup")
async def startup_event():
    """ Load the base model & feature order at startup """
    global model, feature_order
    try:
        model = tf.keras.models.load_model(model_path)
        model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
        with open(feature_order_path, "r") as f:
            feature_order = json.load(f)
        logging.info("Base ML model loaded successfully.")
    except FileNotFoundError:
        raise RuntimeError(f"Error: {model_path} or {feature_order_path} not found. Please ensure initial_train.py has been run.")

def preprocess_json(json_data: dict) -> List[float]:
    """ Convert JSON into a feature vector with categorical encoding """
    if not feature_order:
        logging.error("feature_order is not loaded. Cannot preprocess JSON.")
        return []

    feature_vector = []
    for feature in feature_order:
        value = json_data.get(feature, 0.0) # Use .get() for safer access, default to 0.0
        if value in ["undefined", None, 0, 0.0, ""]:
            feature_vector.append(0.0)
        elif isinstance(value, (int, float)):
            feature_vector.append(float(value))
        else:
            # For string values, try simple hashing. Normalize by a large number.
            # Using str(value) for hashing ensures non-string values are converted before hashing
            feature_vector.append(float(hash(str(value))) / 1e10) 

    return feature_vector

@app.post("/predict")
async def predict_anomaly(body: Dict):
    """
    Predicts anomaly for a user based on provided IP data and their personalized ML data.
    The 'user_ml_data' in the request body represents the user's current pattern memory.
    """
    if "user_email" not in body or "data" not in body:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing 'user_email' or 'data' in request body.")

    user_email = body["user_email"]
    input_data = body["data"]

    # Defensive parsing of user_ml_data:
    # It might come as a dictionary (if Spring Boot's ObjectMapper embeds it as a JSON object)
    # or as a string (if it's double-quoted or sent as a string literal).
    user_ml_data_raw = body.get("user_ml_data", "{}") # Default to empty string JSON for robustness
    logging.info(f"Raw user_ml_data received for {user_email}: Type={type(user_ml_data_raw)}, Value='{user_ml_data_raw}'")

    user_pattern_memory: Dict[str, dict]
    if isinstance(user_ml_data_raw, str):
        try:
            user_pattern_memory = json.loads(user_ml_data_raw)
            logging.info(f"Parsed user_ml_data from string for {user_email}. Result Type: {type(user_pattern_memory)}, Value: {user_pattern_memory}")
        except json.JSONDecodeError as e:
            logging.error(f"Failed to decode user_ml_data string for {user_email}. Data: {user_ml_data_raw}. Error: {e}. Initializing empty memory.")
            user_pattern_memory = {} # Fallback to empty dict if decoding fails
    else:
        user_pattern_memory = user_ml_data_raw # Already a dictionary, use it directly
        logging.info(f"user_ml_data received as non-string for {user_email}. Type: {type(user_pattern_memory)}, Value: {user_pattern_memory}")

    # CRITICAL: Ensure user_pattern_memory is a dictionary before attempting to use it as one
    if not isinstance(user_pattern_memory, dict):
        logging.error(f"user_pattern_memory is NOT a dictionary after parsing for {user_email}. Type: {type(user_pattern_memory)}, Value: {user_pattern_memory}. Resetting to empty dict.")
        user_pattern_memory = {} # Force it to be a dictionary to prevent 'str' object does not support item assignment


    if not isinstance(input_data, dict):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 'data' format. Expected a dictionary.")

    try:
        # Calculate hash for the current input data
        current_feature_hash = str(hash(json.dumps(input_data, sort_keys=True)))

        # --- PERSONALIZATION LOGIC: Check if this exact pattern is in the user's memory ---
        if current_feature_hash in user_pattern_memory:
            # If the pattern is known, consider it 'normal' for this user
            predicted_class = 0 # Force prediction to 0 (normal)
            logging.info(f"Personalized prediction for {user_email}: Pattern '{current_feature_hash}' found in user memory. Predicted: {predicted_class}")
        else:
            # If pattern is not known to this user, use the global model for prediction
            new_vector = preprocess_json(input_data)
            new_input = np.array([new_vector]).reshape(1, 1, len(new_vector))

            predictions = model.predict(new_input)
            predicted_class = np.argmax(predictions, axis=1)[0] # 0 for normal, 1 for anomaly
            logging.info(f"Global model prediction for {user_email}: Pattern '{current_feature_hash}' NOT found in user memory. Predicted: {predicted_class}")

        # Update user's pattern memory with the current pattern (regardless of prediction outcome)
        # This ensures new patterns are always added.
        user_pattern_memory[current_feature_hash] = input_data

        # Return prediction and the updated user-specific ML data (pattern memory)
        return {"prediction": float(predicted_class), "user_ml_data": json.dumps(user_pattern_memory)}

    except Exception as e:
        logging.error(f"Prediction failed for user {user_email}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Prediction failed: {e}")

@app.post("/update_model")
async def update_model_api(body: Dict):
    """
    Updates the personalized ML model data (pattern memory) for a specific user.
    The 'user_ml_data' in the request body is the user's current pattern memory,
    which will be updated and returned.
    """
    if "user_email" not in body or "data" not in body or "target" not in body:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing 'user_email', 'data' or 'target' in request.")

    user_email = body["user_email"]
    input_data = body["data"]
    target = body["target"] # Target (0 for normal) from Spring Boot after TOTP verification
    
    # Defensive parsing of user_ml_data:
    user_ml_data_raw = body.get("user_ml_data", "{}") # Default to empty string JSON for robustness
    logging.info(f"Raw user_ml_data received for update for {user_email}: Type={type(user_ml_data_raw)}, Value='{user_ml_data_raw}'")

    user_pattern_memory: Dict[str, dict]
    if isinstance(user_ml_data_raw, str):
        try:
            user_pattern_memory = json.loads(user_ml_data_raw)
            logging.info(f"Parsed user_ml_data from string for update for {user_email}. Result Type: {type(user_pattern_memory)}, Value: {user_pattern_memory}")
        except json.JSONDecodeError as e:
            logging.error(f"Failed to decode user_ml_data string for update for {user_email}. Data: {user_ml_data_raw}. Error: {e}. Initializing empty memory.")
            user_pattern_memory = {} # Fallback to empty dict if decoding fails
    else:
        user_pattern_memory = user_ml_data_raw # Already a dictionary, use it directly
        logging.info(f"user_ml_data received as non-string for update for {user_email}. Type: {type(user_pattern_memory)}, Value: {user_pattern_memory}")

    # CRITICAL: Ensure user_pattern_memory is a dictionary before attempting to use it as one
    if not isinstance(user_pattern_memory, dict):
        logging.error(f"user_pattern_memory is NOT a dictionary after parsing for update for {user_email}. Type: {type(user_pattern_memory)}, Value: {user_pattern_memory}. Resetting to empty dict.")
        user_pattern_memory = {} # Force it to be a dictionary to prevent 'str' object does not support item assignment


    if not isinstance(input_data, dict) or not isinstance(target, list) or len(target) != 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request format.")

    current_feature_hash = str(hash(json.dumps(input_data, sort_keys=True)))

    # Always add the new pattern to the user's personalized pattern memory (target 0 means this is now 'normal')
    # This specifically marks the current input_data as a known normal pattern for this user.
    if current_feature_hash not in user_pattern_memory:
        user_pattern_memory[current_feature_hash] = input_data
        logging.info(f"Pattern '{current_feature_hash}' marked as normal and added to user {user_email}'s memory.")
    else:
        logging.info(f"Pattern '{current_feature_hash}' already exists in user {user_email}'s memory. No new addition.")

    # --- REMOVED GLOBAL MODEL TRAINING HERE FOR ISOLATED PERSONALIZATION ---
    # The global model is NOT trained on individual user anomaly validations.
    # Personalization is now purely driven by the user's 'user_pattern_memory'.
    # The global model acts as a baseline for unknown patterns across all users.

    # Return the updated user-specific ML data (pattern memory)
    return {"model_updated": True, "message": "User's pattern memory updated.", "user_ml_data": json.dumps(user_pattern_memory)}
