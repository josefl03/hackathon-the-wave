import requests
import sys

URL_BASE = "http://127.0.0.1:8000"

def test_health():
    print("Testing / ...")
    r = requests.get(f"{URL_BASE}/")
    print(r.status_code, r.json())
    return r.status_code == 200

def test_image():
    print("Testing /api/inference/image ...")
    # Provide a valid image path from the datasets or any dummy image
    image_path = "/home/shared/TFIA/hackathon-the-wave/modelos-ia/YOLOv8-Fire-and-Smoke-Detection/datasets/fire-8/valid/images/smoke2_mp4-8_jpg.rf.61f0dd8f46c6f5e0bf96e2e9726c6b08.jpg"
    try:
        with open(image_path, "rb") as f:
            r = requests.post(f"{URL_BASE}/api/inference/image", files={"file": f})
        print(r.status_code, r.json())
    except FileNotFoundError:
        print(f"Skipping image test. Could not find test image: {image_path}")
        print("Please run manually with a valid image.")

def test_audio():
    print("Testing /api/inference/audio ...")
    audio_path = "/home/shared/TFIA/hackathon-the-wave/modelos-ia/yamnet/downloads/fireforge.ogg"
    try:
        with open(audio_path, "rb") as f:
            r = requests.post(f"{URL_BASE}/api/inference/audio", files={"file": f})
        print(r.status_code, r.json())
    except FileNotFoundError:
        print(f"Skipping audio test. Could not find test audio: {audio_path}")
        print("Please run manually with a valid audio.")

if __name__ == "__main__":
    test_health()
    test_image()
    test_audio()
