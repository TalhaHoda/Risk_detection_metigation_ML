import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
import numpy as np
import json
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Set the logging level
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)  # Output to console
    ]
)

# 1. Data Preprocessing Function
def preprocess_json(json_data):
    """
    Processes a single JSON object to create a numerical feature vector,
    including values. Treats specific values as absent with 0.0.
    For other values, it includes them directly in the vector.
    """
    features = sorted(json_data.keys())  # Ensure consistent order of features
    feature_vector = [0.0 if json_data[key] in ["undefined", None, 0, 0.0, ""]
                      else float(json_data[key]) if isinstance(json_data[key], (int, float))
                      else float(hash(json_data[key])) / 1e10  # Simple string hashing
                      for key in features]
    return feature_vector, features

# 2. Model Definition
def create_lstm_model(input_shape, num_classes):
    """
    Creates a basic LSTM model.
    """
    model = Sequential([
        LSTM(64, input_shape=input_shape, return_sequences=False),
        Dense(num_classes, activation='softmax')  # Assuming a classification task
    ])
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    return model

def train_and_save_model(initial_input, initial_target_categorical, model_path="initial_lstm_model.h5"):
    """
    Trains the LSTM model and saves it to the specified path.

    Args:
        initial_input (np.ndarray): The input data for initial training.
        initial_target_categorical (np.ndarray): The target data for initial training.
        model_path (str, optional): Path to save the model. Defaults to "initial_lstm_model.h5".
    """
    try:
        model = create_lstm_model(input_shape=(1, initial_input.shape[2]), num_classes=initial_target_categorical.shape[1])
        model.fit(initial_input, initial_target_categorical, epochs=5, verbose=1)  # Train for a few epochs initially
        model.save(model_path)
        logging.info(f"Model trained and saved as {model_path}")
        return model
    except Exception as e:
        logging.error(f"Error during training and saving model: {e}")
        return None

if __name__ == "__main__":
    # Use the provided data instead of the initial_json_str
    initial_data = {
        "ip": "undefined",
        "network": "undefined",
        "version": "undefined",
        "city": "undefined",
        "region": "undefined",
        "region_code": "undefined",
        "country": "undefined",
        "country_name": "undefined",
        "country_code": "undefined",
        "country_code_iso3": "undefined",
        "country_capital": "undefined",
        "country_tld": "undefined",
        "continent_code": "undefined",
        "in_eu": False,
        "postal": "undefined",
        "latitude": 00.0000,
        "longitude": 00.0000,
        "timezone": "undefined",
        "utc_offset": "undefined",
        "country_calling_code": "undefined",
        "currency": "undefined",
        "currency_name": "undefined",
        "languages": "undefined",
        "country_area": 0000000,
        "country_population": 0000000000,
        "asn": "undefined",
        "org": "undefined"
    }

    # Preprocess the initial JSON to get the feature order and initial vector
    initial_vector, feature_order = preprocess_json(initial_data)
    num_features = len(initial_vector)

    # Assuming an initial target label
    initial_target = np.array([0])  # Or whatever is the correct initial target
    num_classes = 2  # Example: assuming 2 classes.  Adjust as needed.
    initial_target_categorical = tf.keras.utils.to_categorical(initial_target, num_classes=num_classes)

    # Reshape for LSTM input
    initial_input = np.array([initial_vector])
    initial_input = np.reshape(initial_input, (initial_input.shape[0], 1, initial_input.shape[1]))

    # Create and train the model, and handle potential errors
    model = train_and_save_model(initial_input, initial_target_categorical)
    if model is None:
        logging.error("Failed to train and save the initial model. Exiting.")
        sys.exit(1)

    # Save the feature order
    try:
        with open("feature_order.json", "w") as f:
            json.dump(feature_order, f)
        logging.info("Feature order saved as feature_order.json")
    except Exception as e:
        logging.error(f"Error saving feature order: {e}")
        sys.exit(1)