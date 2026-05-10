import tensorflow as tf
import numpy as np

MODEL_PATH = "best_model_phase1.keras"

try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("Model loaded successfully.")
    model.summary()
    
    # Create a dummy input
    # Assuming 224x224x3 based on my previous code
    dummy_input = np.random.rand(1, 224, 224, 3).astype(np.float32)
    prediction = model.predict(dummy_input)
    
    print("\nPrediction type:", type(prediction))
    if isinstance(prediction, list):
        print("Prediction is a list with length:", len(prediction))
        for i, p in enumerate(prediction):
            print(f"Output {i} shape: {p.shape}")
    else:
        print("Prediction shape:", prediction.shape)
        
except Exception as e:
    print(f"Error: {e}")
