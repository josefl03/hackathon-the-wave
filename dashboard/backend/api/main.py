from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import uvicorn
import io
import urllib.request
from pathlib import Path
import csv
import logging
import time
import sys
import torch
import numpy as np

# Add audioset_tagging_cnn/pytorch to sys.path
pytorch_dir = Path("/home/shared/TFIA/hackathon-the-wave/modelos-ia/mobilenetv2/audioset_tagging_cnn/pytorch")
if str(pytorch_dir) not in sys.path:
    sys.path.insert(0, str(pytorch_dir))

# Create a logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("inference_api")

app = FastAPI(title="AI Inference Backend")

# -------------------------------------------------------------------
# Model Globals
# -------------------------------------------------------------------
yolo_model = None
mobilenet_model = None
mobilenet_class_names = []
MOBILENET_FIRE_IDX = -1
MOBILENET_CRACKLE_IDX = -1
MOBILENET_DEVICE = None

YOLO_MODEL_PATH = "/home/shared/TFIA/hackathon-the-wave/modelos-ia/YOLOv8-Fire-and-Smoke-Detection/runs/detect/train/weights/best.pt"
MOBILENET_DIR = Path("/home/shared/TFIA/hackathon-the-wave/modelos-ia/mobilenetv2")
MOBILENET_MODEL_PATH = MOBILENET_DIR / "audioset_tagging_cnn" / "MobileNetV2_mAP=0.383.pth"
MOBILENET_METADATA_PATH = MOBILENET_DIR / "audioset_tagging_cnn" / "metadata" / "class_labels_indices.csv"

# -------------------------------------------------------------------
# Startup & Loading
# -------------------------------------------------------------------
def get_yolo_model():
    global yolo_model
    if yolo_model is None:
        try:
            from ultralytics import YOLO
            logger.info(f"Loading original YOLOv8 model from {YOLO_MODEL_PATH}...")
            yolo_model = YOLO(YOLO_MODEL_PATH)
            logger.info("YOLOv8 model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load YOLOv8 model: {e}")
    return yolo_model

@app.on_event("startup")
def startup_event():
    global mobilenet_model, mobilenet_class_names
    global MOBILENET_FIRE_IDX, MOBILENET_CRACKLE_IDX, MOBILENET_DEVICE
    logger.info("Starting up... initializing engines.")

    # Load YOLO model
    get_yolo_model()

    # Load MobileNetV2
    try:
        MOBILENET_DEVICE = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')
        logger.info(f"Loading MobileNetV2 from {MOBILENET_MODEL_PATH} on {MOBILENET_DEVICE}...")
        
        from models import MobileNetV2
        
        mobilenet_model = MobileNetV2(
            sample_rate=32000, window_size=1024, hop_size=320, 
            mel_bins=64, fmin=50, fmax=14000, classes_num=527
        )
        
        checkpoint = torch.load(MOBILENET_MODEL_PATH, map_location=MOBILENET_DEVICE, weights_only=False)
        if 'model' in checkpoint:
            mobilenet_model.load_state_dict(checkpoint['model'])
        else:
            mobilenet_model.load_state_dict(checkpoint)
            
        mobilenet_model.to(MOBILENET_DEVICE)
        
        # Half Precision (FP16) tuning for lowest latency
        if MOBILENET_DEVICE.type == 'cuda':
            mobilenet_model = mobilenet_model.half()
            
        mobilenet_model.eval()
        
        # Warm-up inference
        dummy_audio = torch.zeros((1, 32000)).to(MOBILENET_DEVICE)
        if MOBILENET_DEVICE.type == 'cuda':
            dummy_audio = dummy_audio.half()
            
        with torch.inference_mode():
            _ = mobilenet_model(dummy_audio)
 
        # Load class metadata
        with MOBILENET_METADATA_PATH.open(newline="", encoding="utf-8") as fh:
            reader = csv.DictReader(fh)
            idx_to_name = {int(row["index"]): row["display_name"] for row in reader}
            max_idx = max(idx_to_name.keys())
            mobilenet_class_names = [idx_to_name.get(i, "Unknown") for i in range(max_idx + 1)]
            
        MOBILENET_FIRE_IDX = mobilenet_class_names.index("Fire") if "Fire" in mobilenet_class_names else -1
        MOBILENET_CRACKLE_IDX = mobilenet_class_names.index("Crackle") if "Crackle" in mobilenet_class_names else -1
            
        logger.info(f"MobileNetV2 loaded! Fire_idx={MOBILENET_FIRE_IDX}, Crackle_idx={MOBILENET_CRACKLE_IDX}")
    except Exception as e:
        logger.error(f"Failed to load MobileNetV2 model: {e}")

# -------------------------------------------------------------------
# Helper functions
# -------------------------------------------------------------------
def decode_audio_bytes(audio_bytes: bytes):
    import numpy as np
    import soundfile as sf
    import subprocess
    import tempfile
    
    with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
        
    try:
        audio, sr = sf.read(tmp_path, dtype="float32")
        if audio.ndim > 1:
            audio = np.mean(audio, axis=1)
        Path(tmp_path).unlink()
        return audio.astype("float32"), sr
    except Exception:
        # Fallback to ffmpeg
        proc = subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-loglevel", "error",
                "-i", tmp_path, "-f", "f32le", "-acodec", "pcm_f32le",
                "-ac", "1", "-ar", "16000", "pipe:1"
            ],
            check=False,
            stdout=subprocess.PIPE,
        )
        Path(tmp_path).unlink()
        if proc.returncode != 0:
            raise ValueError("Failed to decode audio.")
        return np.frombuffer(proc.stdout, dtype=np.float32), 16000

# -------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------
@app.get("/")
def health_check():
    return {
        "status": "ok",
        "yolo_loaded": yolo_model is not None,
        "mobilenet_loaded": mobilenet_model is not None
    }

@app.post("/api/inference/image")
async def infer_image(file: UploadFile = File(...)):
    """
    Run fast YOLOv8 inference on an uploaded image.
    Returns the bounding boxes, classes, and probabilities.
    """
    model = get_yolo_model()
    if model is None:
        raise HTTPException(status_code=500, detail="YOLOv8 model failed to load.")
        
    start_time = time.time()
    
    try:
        from PIL import Image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")

    # Run inference with higher confidence to filter out false positives
    results = model(image, conf=0.40, iou=0.45)
    
    detections = []
    # results is a list of Results objects (one per image)
    for r in results:
        boxes = r.boxes
        for box in boxes:
            # coordinates: [x1, y1, x2, y2]
            coords = box.xyxy[0].tolist() 
            prob = float(box.conf[0])
            cls_index = int(box.cls[0])
            cls_name = yolo_model.names[cls_index]
            
            detections.append({
                "square": coords, # [x1, y1, x2, y2]
                "probability": prob,
                "class": cls_name
            })
            
    latency = time.time() - start_time
    
    return JSONResponse(content={
        "latency_sec": latency,
        "detections": detections
    })

@app.post("/api/inference/audio")
async def infer_audio(file: UploadFile = File(...)):
    """
    Run MobileNetV2 inference on an uploaded audio file.
    Returns the fire probability and top predicted classes.
    """
    if mobilenet_model is None:
        raise HTTPException(status_code=500, detail="MobileNetV2 model not loaded")
        
    start_time = time.time()
    
    try:
        audio_bytes = await file.read()
        audio, sr = decode_audio_bytes(audio_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid audio file: {e}")
    
    if sr != 32000:
        from scipy.signal import resample_poly
        audio = resample_poly(audio, 32000, sr).astype("float32")
        
    with torch.inference_mode():
        input_tensor = torch.tensor(audio[None, :]).to(MOBILENET_DEVICE)
        if MOBILENET_DEVICE.type == 'cuda':
            input_tensor = input_tensor.half()
            
        outputs = mobilenet_model(input_tensor)
        if isinstance(outputs, dict) and 'clipwise_output' in outputs:
            scores = outputs['clipwise_output'].float().cpu().numpy()[0]
        else:
            scores = outputs.float().cpu().numpy()[0]
            
    fire_score = 0.0
    if MOBILENET_FIRE_IDX != -1:
        fire_score += scores[MOBILENET_FIRE_IDX]
    if MOBILENET_CRACKLE_IDX != -1:
        fire_score += scores[MOBILENET_CRACKLE_IDX]
        
    top_k = np.argsort(scores)[::-1][:5]
    top_classes = [{"class": mobilenet_class_names[idx], "probability": float(scores[idx])} for idx in top_k]

    latency = time.time() - start_time
    
    return JSONResponse(content={
        "latency_sec": latency,
        "fire_probability": float(fire_score),
        "top_classes": top_classes
    })

@app.websocket("/api/ws/audio")
async def websocket_audio(websocket: WebSocket):
    """
    Real-time MobileNetV2 inference via WebSockets.
    Accepts generic audio bytes (e.g. from MediaRecorder), decodes it,
    resamples to 32kHz, and returns a JSON response with fire_probability.
    """
    await websocket.accept()
    if mobilenet_model is None:
        await websocket.close(code=1011, reason="MobileNetV2 model not loaded")
        return

    from scipy.signal import resample_poly

    try:
        while True:
            audio_bytes = await websocket.receive_bytes()
            start_time = time.time()
            
            try:
                audio, sr = decode_audio_bytes(audio_bytes)
            except Exception as e:
                await websocket.send_json({"error": f"Failed to process audio: {e}"})
                continue
            
            if sr != 32000:
                audio = resample_poly(audio, 32000, sr).astype("float32")
                
            # inference mode for lowest latency
            with torch.inference_mode():
                # Shape: (batch_size, samples) -> (1, N)
                input_tensor = torch.tensor(audio[None, :]).to(MOBILENET_DEVICE)
                
                if MOBILENET_DEVICE.type == 'cuda':
                    input_tensor = input_tensor.half()
                    
                outputs = mobilenet_model(input_tensor)
                
                if isinstance(outputs, dict) and 'clipwise_output' in outputs:
                    scores = outputs['clipwise_output'].float().cpu().numpy()[0]
                else:
                    scores = outputs.float().cpu().numpy()[0]
                    
            fire_score = 0.0
            if MOBILENET_FIRE_IDX != -1:
                fire_score += scores[MOBILENET_FIRE_IDX]
            if MOBILENET_CRACKLE_IDX != -1:
                fire_score += scores[MOBILENET_CRACKLE_IDX]
                
            top_k = np.argsort(scores)[::-1][:5]
            top_classes = [{"class": mobilenet_class_names[idx], "probability": float(scores[idx])} for idx in top_k]

            latency = time.time() - start_time
            
            await websocket.send_json({
                "latency_sec": latency,
                "fire_probability": float(fire_score),
                "top_classes": top_classes
            })
            
    except WebSocketDisconnect:
        logger.info("Client disconnected from audio WebSocket")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
