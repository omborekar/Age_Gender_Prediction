"""
Age & Gender AI - FastAPI Backend
Pipeline: Upload → Face Detection (OpenCV Haar) → Crop → 96×96 → TF Model → JSON
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
import io
import os
import traceback

# ─── Model path ────────────────────────────────────────────────────
MODEL_PATH   = "best_model_phase1.keras"
CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"

model   = None
cascade = None

# ─── Startup / shutdown ────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, cascade

    # Load Haar cascade
    cascade = cv2.CascadeClassifier(CASCADE_PATH)
    if cascade.empty():
        print("[WARN] Haar cascade failed to load – face detection disabled.")
        cascade = None
    else:
        print("[OK] Haar cascade loaded.")

    # Load Keras model
    if os.path.exists(MODEL_PATH):
        try:
            model = tf.keras.models.load_model(MODEL_PATH)
            # Warm-up inference
            dummy = np.zeros((1, 96, 96, 3), dtype=np.float32)
            model.predict(dummy, verbose=0)
            print(f"[OK] Model loaded and warmed up from '{MODEL_PATH}'.")
        except Exception as e:
            print(f"[ERROR] Model load failed: {e}")
    else:
        print(f"[WARN] '{MODEL_PATH}' not found – running in MOCK mode.")

    yield
    print("[INFO] Shutting down.")


app = FastAPI(title="Age & Gender AI API", version="2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Image helpers ─────────────────────────────────────────────────
def bytes_to_cv2(data: bytes):
    arr = np.frombuffer(data, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)

def detect_and_crop(img_bgr):
    """Return (cropped_rgb_pil, face_found: bool)."""
    if cascade is None:
        # No cascade – use full frame
        rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        return Image.fromarray(rgb), False

    gray  = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(48, 48),
        flags=cv2.CASCADE_SCALE_IMAGE
    )

    if len(faces) == 0:
        # No face found – fallback to full frame
        rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        return Image.fromarray(rgb), False

    # Pick the largest face
    x, y, w, h = max(faces, key=lambda r: r[2] * r[3])

    # Add a 20 % padding around the face
    pad_x = int(w * 0.20)
    pad_y = int(h * 0.20)
    ih, iw = img_bgr.shape[:2]
    x1 = max(0,  x  - pad_x)
    y1 = max(0,  y  - pad_y)
    x2 = min(iw, x  + w + pad_x)
    y2 = min(ih, y  + h + pad_y)

    cropped = img_bgr[y1:y2, x1:x2]
    rgb     = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB)
    return Image.fromarray(rgb), True

def preprocess(pil_img: Image.Image) -> np.ndarray:
    img = pil_img.resize((96, 96), Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)

# ─── Endpoints ─────────────────────────────────────────────────────
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    allowed = ("image/", "application/octet-stream")
    if not any(file.content_type.startswith(p) for p in allowed):
        raise HTTPException(400, "File must be an image")

    contents = await file.read()

    # ── MOCK mode ──────────────────────────────────────────────────
    if model is None:
        import random
        gender = random.choice(["Male", "Female"])
        return {
            "gender":            gender,
            "gender_confidence": round(random.uniform(0.72, 0.97), 3),
            "age":               round(random.uniform(18, 60), 1),
            "face_detected":     False,
            "mock":              True,
        }

    try:
        img_bgr = bytes_to_cv2(contents)
        if img_bgr is None:
            raise ValueError("Could not decode image bytes.")

        face_pil, face_found = detect_and_crop(img_bgr)
        tensor = preprocess(face_pil)

        raw = model.predict(tensor, verbose=0)

        gender_val  = float(np.squeeze(raw[0]))
        age_raw     = float(np.squeeze(raw[1]))

        # UTKFace: gender 0 = Male, 1 = Female
        gender      = "Male" if gender_val < 0.5 else "Female"
        gender_conf = float(1.0 - gender_val if gender_val < 0.5 else gender_val)

        # Age: model was trained with labels = real_age (not normalised)
        # If the model returns values > 1 it's real-age; if < 1, scale up.
        if age_raw < 1.5:
            age_val = age_raw * 100.0
        else:
            age_val = age_raw
        age_val = max(1.0, min(100.0, age_val))

        print(f"[PREDICT] FaceDetected={face_found} | {gender} ({gender_conf:.1%}) | Age {age_val:.1f}")

        return {
            "gender":            gender,
            "gender_confidence": round(gender_conf, 3),
            "age":               round(age_val, 1),
            "face_detected":     face_found,
            "mock":              False,
        }

    except Exception:
        print(traceback.format_exc())
        raise HTTPException(500, "Prediction pipeline failed. Check server logs.")


@app.get("/")
def health():
    return {
        "status":          "online",
        "model_loaded":    model is not None,
        "face_detection":  cascade is not None and not cascade.empty(),
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
