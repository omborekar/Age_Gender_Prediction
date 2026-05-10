import gradio as gr
import cv2
import numpy as np
from PIL import Image
import tensorflow as tf
import os

MODEL_PATH = "best_model_phase1.keras"
CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
model = None
cascade = None

def load_models():
    global model, cascade
    if cascade is None:
        cascade = cv2.CascadeClassifier(CASCADE_PATH)
        if cascade.empty():
            print("[WARN] Haar cascade not loaded.")
            cascade = None
    if model is None and os.path.exists(MODEL_PATH):
        try:
            model = tf.keras.models.load_model(MODEL_PATH)
            # warmup
            model.predict(np.zeros((1,96,96,3), dtype=np.float32), verbose=0)
            print("[INFO] Model loaded successfully.")
        except Exception as e:
            print(f"[ERROR] Failed to load model: {e}")
            
load_models()

def find_faces(img_bgr):
    if cascade is None or cascade.empty():
        return []
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    faces = cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40),
        flags=cv2.CASCADE_SCALE_IMAGE
    )
    return faces.tolist() if len(faces) else []

def crop_face(img_bgr, faces):
    if faces:
        x, y, w, h = max(faces, key=lambda r: r[2]*r[3])
        pad_x, pad_y = int(w*0.20), int(h*0.20)
        ih, iw = img_bgr.shape[:2]
        x1 = max(0, x - pad_x); y1 = max(0, y - pad_y)
        x2 = min(iw, x + w + pad_x); y2 = min(ih, y + h + pad_y)
        roi = img_bgr[y1:y2, x1:x2]
    else:
        roi = img_bgr
    rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
    return Image.fromarray(rgb), bool(faces)

def preprocess(pil_img):
    img = pil_img.resize((96, 96), Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, 0)

def predict(image):
    if image is None:
        return None
    
    # image is RGB numpy array from Gradio
    img_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    faces = find_faces(img_bgr)
    
    face_pil, face_found = crop_face(img_bgr, faces)
    
    label = "No Model Loaded"
    color = (0, 0, 255) # BGR Red
    
    if model is not None:
        try:
            tensor = preprocess(face_pil)
            raw = model.predict(tensor, verbose=0)
            
            gender_val = float(np.squeeze(raw[0]))
            age_raw = float(np.squeeze(raw[1]))
            
            gender = "Male" if gender_val < 0.5 else "Female"
            # Reverse normalization for age if needed (from original implementation)
            age_val = (age_raw * 99 + 1) if age_raw <= 1.5 else age_raw
            age_val = max(1.0, min(100.0, age_val))
            
            label = f"{gender} ({age_val:.1f} yrs)"
            color = (255, 240, 0) if gender == "Male" else (133, 0, 255) # Cyan/Pink in BGR
        except Exception as e:
            label = "Prediction Error"
        
    # Draw boxes and labels
    if faces:
        x, y, w, h = max(faces, key=lambda r: r[2]*r[3])
        cv2.rectangle(img_bgr, (x, y), (x+w, y+h), color, 2)
        cv2.putText(img_bgr, label, (x, max(15, y-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2, cv2.LINE_AA)
    else:
        cv2.putText(img_bgr, "No Face Detected - " + label, (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2, cv2.LINE_AA)
        
    return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

with gr.Blocks(title="Neural Decode AI") as demo:
    gr.Markdown("# 🧠 Neural Decode - Age & Gender Biometrics")
    gr.Markdown("Capture an image using your webcam or upload a file. The AI will instantly detect the main face and predict the subject's gender and age.")
    
    with gr.Tabs():
        with gr.TabItem("Live Webcam"):
            with gr.Row():
                with gr.Column():
                    cam_input = gr.Image(sources=["webcam"], streaming=True, label="Live Feed")
                with gr.Column():
                    cam_output = gr.Image(interactive=False, label="Prediction Result")
            cam_input.stream(fn=predict, inputs=cam_input, outputs=cam_output)
            
        with gr.TabItem("Image Upload"):
            with gr.Row():
                with gr.Column():
                    up_input = gr.Image(sources=["upload"], label="Upload Image")
                with gr.Column():
                    up_output = gr.Image(interactive=False, label="Prediction Result")
            up_input.change(fn=predict, inputs=up_input, outputs=up_output)

if __name__ == "__main__":
    demo.launch(server_name="127.0.0.1", server_port=7860, show_error=True, theme=gr.themes.Monochrome())
