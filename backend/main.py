"""
Age & Gender AI - FastAPI Backend v3
Endpoints:
  GET  /           - health
  POST /detect     - face detection only (for live green-box overlay)
  POST /predict    - full pipeline: detect → crop → predict
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, tensorflow as tf, numpy as np, cv2
from PIL import Image
import io, os, traceback

MODEL_PATH   = "best_model_phase1.keras"
CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
model = None
cascade = None

# ── Startup ────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, cascade
    cascade = cv2.CascadeClassifier(CASCADE_PATH)
    if cascade.empty():
        print("[WARN] Haar cascade not loaded.")
        cascade = None
    else:
        print("[OK] Haar cascade ready.")

    if os.path.exists(MODEL_PATH):
        try:
            model = tf.keras.models.load_model(MODEL_PATH)
            model.predict(np.zeros((1,96,96,3), dtype=np.float32), verbose=0)
            print(f"[OK] Model '{MODEL_PATH}' loaded and warmed up.")
        except Exception as e:
            print(f"[ERROR] Model load failed: {e}")
    else:
        print(f"[WARN] '{MODEL_PATH}' not found. MOCK mode active.")
    yield
    print("[INFO] Shutting down.")

app = FastAPI(title="Age & Gender AI", version="3.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── Helpers ────────────────────────────────────────────────────────
def to_cv2(data: bytes):
    arr = np.frombuffer(data, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)

def find_faces(img_bgr):
    """Return list of (x,y,w,h) or empty."""
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
    """Crop largest face with 20% padding. Returns PIL RGB."""
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

# ── Endpoints ──────────────────────────────────────────────────────
@app.get("/")
def health():
    return {
        "status":         "online",
        "model_loaded":   model is not None,
        "face_detection": cascade is not None and not cascade.empty(),
    }

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    """Lightweight endpoint: returns face bounding boxes (normalised 0-1)."""
    contents = await file.read()
    img = to_cv2(contents)
    if img is None:
        return {"faces": []}
    faces = find_faces(img)
    ih, iw = img.shape[:2]
    norm = [{"x": x/iw, "y": y/ih, "w": w/iw, "h": h/ih}
            for x, y, w, h in faces]
    return {"faces": norm}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    allowed = ("image/", "application/octet-stream")
    if not any(file.content_type.startswith(p) for p in allowed):
        raise HTTPException(400, "Must be an image file.")
    contents = await file.read()

    # MOCK mode
    if model is None:
        import random
        gender = random.choice(["Male", "Female"])
        return {"gender": gender,
                "gender_confidence": round(random.uniform(0.70, 0.97), 3),
                "age": round(random.uniform(18, 55), 1),
                "face_detected": False, "mock": True}
    try:
        img_bgr = to_cv2(contents)
        if img_bgr is None:
            raise ValueError("Could not decode image.")
        faces       = find_faces(img_bgr)
        face_pil, face_found = crop_face(img_bgr, faces)
        tensor      = preprocess(face_pil)
        raw         = model.predict(tensor, verbose=0)

        gender_val  = float(np.squeeze(raw[0]))
        age_raw     = float(np.squeeze(raw[1]))

        gender      = "Male" if gender_val < 0.5 else "Female"
        gender_conf = float(1.0 - gender_val if gender_val < 0.5 else gender_val)

        age_val = (age_raw * 99 + 1) if age_raw <= 1.5 else age_raw
        age_val = max(1.0, min(100.0, age_val))

        print(f"[PREDICT] {gender} ({gender_conf:.1%}) Age {age_val:.1f} | face={face_found}")
        return {"gender": gender, "gender_confidence": round(gender_conf, 3),
                "age": round(age_val, 1), "face_detected": face_found, "mock": False}
    except Exception:
        print(traceback.format_exc())
        raise HTTPException(500, "Prediction failed. Check server logs.")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
