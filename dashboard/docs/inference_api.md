# Inference API Backend

The `dashboard/backend/api/` directories a FastAPI microservice designed to serve our AI models over HTTP.
The primary advantage over standard Next.js API Routes is that FastAPI loads PyTorch/TensorFlow models directly into GPU/CPU memory once on startup. This allows subsequent requests to be processed **in real-time**.

## Running the Backend

First, ensure you have Python 3 installed.

```bash
cd dashboard/backend/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

The server will automatically download the `tensorflow_hub` YAMNet weights and the class map, and load the custom YOLOv8 model from `modelos-ia/YOLOv8-Fire-and-Smoke-Detection/runs/detect/train/weights/best.pt`.
It broadcasts on `http://0.0.0.0:8000`.

## Endpoints

### 1. `GET /` - Health Check

Returns the status of both models. Will return:
```json
{
  "status": "ok",
  "yolo_loaded": true,
  "yamnet_loaded": true
}
```

### 2. `POST /api/inference/image` - YOLOv8 Image Inference

Takes an uploaded image file (multiform/part) and runs YOLOv8 Fire/Smoke object detection on it.

*   **Parameter:** `file` (File) — The image to infer.
*   **Response:**
```json
{
  "latency_sec": 0.05,
  "detections": [
    {
      "square": [96.0, 100.0, 420.5, 300.0],
      "probability": 0.94,
      "class": "fire"
    }
  ]
}
```

### 3. `POST /api/inference/audio` - YAMNet Audio Inference

Takes an uploaded audio chunk (optimally 2 seconds) and returns a fire probabilitity score based on the YAMNet `Fire` and `Crackle` audio classes.

*   **Parameter:** `file` (File) — The audio file to infer (WAV, OGG, mp3... handled by Soundfile/FFmpeg).
*   **Response:**
```json
{
  "latency_sec": 0.03,
  "fire_probability": 0.012,
  "top_classes": [
    {"class": "Wind", "probability": 0.45},
    {"class": "Rain", "probability": 0.32}
  ]
}
```

## Testing Locally using cURL

You can test the instances using basic `curl` commands:

```bash
# Test Yolo Image Detection
curl -X POST "http://127.0.0.0:8000/api/inference/image" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/test/image.jpg"

# Test YAMNet Audio Sound Classification
curl -X POST "http://127.0.0.0:8000/api/inference/audio" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/test/audio.ogg"
```
