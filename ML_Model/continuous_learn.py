import tensorflow as tf
from tensorflow.keras.models import load_model
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
# Enable eager execution for functions
tf.config.run_functions_eagerly(True)
# Enable debug mode for tf.data
tf.data.experimental.enable_debug_mode()

# 1. Data Preprocessing Function
def preprocess_json(json_data, feature_order):
    """
    Processes a single JSON object to create a numerical feature vector,
    including values. Treats specific values as absent with 0.0.
    For other values, it includes them directly in the vector.
    """
    feature_vector = []
    for feature in feature_order:
        if feature in json_data:
            value = json_data[feature]
            if value in ["undefined", None, 0, 0.0, ""]:
                feature_vector.append(0.0)
            elif isinstance(value, (int, float)):
                feature_vector.append(float(value))
            else:
                # For string values, try simple hashing
                feature_vector.append(float(hash(value)) / 1e10)
        else:
            feature_vector.append(0.0)
    return feature_vector

def update_model(model, new_input, new_target_categorical, retrain=True, model_path="updated_lstm_model.h5"):
    """
    Updates the LSTM model with new data and saves it.

    Args:
        model (tf.keras.Model): The LSTM model to update.
        new_input (np.ndarray): The new input data.
        new_target_categorical (np.ndarray): The new target data.
        retrain (bool, optional): Whether to retrain the model. Defaults to True.
        model_path (str, optional): Path to save the updated model. Defaults to "updated_lstm_model.h5".
    """
    try:
        if retrain:
            dataset = tf.data.Dataset.from_tensor_slices((new_input, new_target_categorical))
            dataset = dataset.batch(1)
            for features, labels in dataset:
                model.train_step((features, labels))
            logging.info("Model updated.")
        else:
            logging.info("Model not retrained.")

        model.save(model_path)
        logging.info(f"Updated model saved to {model_path}")
    except Exception as e:
        logging.error(f"Error updating and saving model: {e}")
        return False  # Indicate failure
    return True #Indicate success

def continuous_learning():
    """
    Loads the pre-trained model, accepts JSON input, and updates the model
    only if the new pattern (feature vector) is different from existing ones.
    Target label '1' and saving 'yes' are automated for new patterns.
    """
    model_path = "initial_lstm_model.h5"
    feature_order_path = "feature_order.json"
    try:
        model = load_model(model_path)
        model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        with open(feature_order_path, "r") as f:
            feature_order = json.load(f)
        logging.info("Model and feature order loaded and recompiled successfully.")
    except FileNotFoundError:
        logging.error(f"Error: {model_path} or {feature_order_path} not found. Please run initial_train.py first.")
        sys.exit(1)  # Use sys.exit() for a more robust exit

    num_features = len(feature_order)
    num_classes = model.output_shape[-1]
    existing_patterns = []  # To store previously seen feature vectors

    while True:
        user_input = input("Enter a new JSON (or type 'exit' to quit):\n")
        if user_input.lower() == 'exit':
            break

        try:
            new_json_data = json.loads(user_input)
        except json.JSONDecodeError:
            logging.error("Invalid JSON format. Please try again.")
            continue

        # Preprocess the new JSON data
        try:
            new_vector = preprocess_json(new_json_data, feature_order)
        except Exception as e:
            logging.error(f"Error preprocessing JSON data: {e}")
            continue

        new_input = np.array([new_vector])
        new_input = np.reshape(new_input, (new_input.shape[0], 1, new_input.shape[1]))

        # Check if the new pattern already exists
        is_new_pattern = True
        for pattern in existing_patterns:
            if np.array_equal(new_vector, pattern):  # Compare the value-based vectors
                is_new_pattern = False
                logging.info("Existing pattern detected.")
                try:
                    predictions = model.predict(new_input)
                    logging.info(f"Predictions: {predictions}")
                except Exception as e:
                    logging.error(f"Error during prediction: {e}")
                break

        if is_new_pattern:
            logging.info("New pattern detected. Automating target label '1' and saving model.")
            new_target = 1
            new_target_categorical = np.array([tf.keras.utils.to_categorical(new_target, num_classes=num_classes)])

            existing_patterns.append(new_vector)  # Add the value-based vector
            # Update the model and handle errors
            if not update_model(model, new_input, new_target_categorical):
                logging.error("Failed to update the model.")
                continue  # Consider whether to continue or break the loop

            try:
                predictions = model.predict(new_input)
                logging.info(f"Predictions: {predictions}")
            except Exception as e:
                logging.error(f"Error during prediction: {e}")

        else:
            pass  # Predictions are already printed for existing patterns

if __name__ == "__main__":
    continuous_learning()