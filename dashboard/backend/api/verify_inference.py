import requests
import io
from PIL import Image, ImageDraw

def test_inference():
    # URL of the local FastAPI server
    url = "http://127.0.0.1:8000/api/inference/image"
    
    # Create a dummy image with a red square (to simulate fire-ish colors)
    img = Image.new('RGB', (640, 640), color = (73, 109, 137))
    d = ImageDraw.Draw(img)
    d.rectangle([200, 200, 400, 400], fill=(255, 0, 0)) # Red box
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr = img_byte_arr.getvalue()
    
    files = {'file': ('frame.jpg', img_byte_arr, 'image/jpeg')}
    
    try:
        r = requests.post(url, files=files)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_inference()
