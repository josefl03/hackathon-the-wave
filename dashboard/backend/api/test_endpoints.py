import requests
import sys

URL_BASE = "http://127.0.0.1:8001"

def test_health():
    print("Testing / ...")
    r = requests.get(f"{URL_BASE}/")
    print(r.status_code, r.json())
    return r.status_code == 200

def test_image():
    print("Testing /api/inference/image ...")
    # Using the created verify_inference.py logic or just a valid dummy
    import io
    from PIL import Image
    img = Image.new('RGB', (640, 640), color = (73, 109, 137))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr = img_byte_arr.getvalue()
    
    files = {'file': ('frame.jpg', img_byte_arr, 'image/jpeg')}
    try:
        r = requests.post(f"{URL_BASE}/api/inference/image", files=files)
        print(r.status_code, r.json())
    except Exception as e:
        print(f"Error: {e}")

def test_audio():
    print("Testing /api/inference/audio ...")
    # Finding a real audio sample in the workspace
    audio_path = "../../modelos-ia/sample/audio_sample_30s.wav"
    try:
        with open(audio_path, "rb") as f:
            r = requests.post(f"{URL_BASE}/api/inference/audio", files={"file": f})
        print(r.status_code, r.json())
    except FileNotFoundError:
        print(f"Skipping audio test. Could not find test audio: {audio_path}")

if __name__ == "__main__":
    test_health()
    test_image()
    test_audio()
