#!/usr/bin/env python3
"""Run MobileNetV2 (from PANNs) on fire and non-fire sample audios.

This script uses the pre-trained MobileNetV2 from the audioset_tagging_cnn repo
to classify chunks of audio in real-time or simulate real-time performance.
"""

import sys
from pathlib import Path
import csv
import urllib.request
import torch
import numpy as np
import librosa
import subprocess

# Add audioset_tagging_cnn/pytorch to sys.path to import its modules
script_dir = Path(__file__).resolve().parent
pytorch_dir = script_dir / "audioset_tagging_cnn" / "pytorch"
sys.path.insert(0, str(pytorch_dir))

from models import MobileNetV2

# Constants matching the PANNs training parameters
SAMPLE_RATE = 32000
WINDOW_SIZE = 1024
HOP_SIZE = 320
MEL_BINS = 64
FMIN = 50
FMAX = 14000
CLASSES_NUM = 527

SAMPLES = [
    {
        "name": "fireforge",
        "url": "https://commons.wikimedia.org/wiki/Special:FilePath/WWS_Fireoftheforge.ogg",
        "label": "fire",
    },
    {
        "name": "crackling_fire",
        "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Campfire_sound_ambience.ogg",
        "label": "fire-like",
    },
    {
        "name": "rain",
        "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Sound_of_rain.ogg",
        "label": "non-fire",
    },
    {
        "name": "forest",
        "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Forest_track_2.ogg",
        "label": "non-fire",
    },
]

def load_class_map(csv_path: Path) -> dict:
    idx_to_name = {}
    with csv_path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            idx_to_name[int(row["index"])] = row["display_name"]
    # Convert to list ordered by index
    max_idx = max(idx_to_name.keys())
    class_names = [idx_to_name.get(i, "Unknown") for i in range(max_idx + 1)]
    return class_names

def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )
        },
    )
    with urllib.request.urlopen(request) as response, dest.open("wb") as out:
        out.write(response.read())

def decode_audio(path: Path, target_sr=32000):
    try:
        import soundfile as sf
        audio, sr = sf.read(str(path), dtype="float32")
        if audio.ndim > 1:
            audio = np.mean(audio, axis=1)
        if sr != target_sr:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr)
        return audio
    except Exception:
        # Fallback to ffmpeg
        proc = subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-loglevel", "error",
                "-i", str(path), "-f", "f32le", "-acodec", "pcm_f32le",
                "-ac", "1", "-ar", str(target_sr), "pipe:1",
            ],
            check=True,
            stdout=subprocess.PIPE,
        )
        return np.frombuffer(proc.stdout, dtype=np.float32)

def main():
    device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')
    print(f"Using device: {device}")

    # Load Model
    model = MobileNetV2(
        sample_rate=SAMPLE_RATE, window_size=WINDOW_SIZE, hop_size=HOP_SIZE, 
        mel_bins=MEL_BINS, fmin=FMIN, fmax=FMAX, classes_num=CLASSES_NUM
    )
    checkpoint_path = script_dir / "audioset_tagging_cnn" / "MobileNetV2_mAP=0.383.pth"
    print(f"Loading checkpoint from: {checkpoint_path}")
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
    
    # Pre-trained models in PANNs usually have 'model' key encapsulating state dict
    if 'model' in checkpoint:
        model.load_state_dict(checkpoint['model'])
    else:
        model.load_state_dict(checkpoint)
        
    model.to(device)
    model.eval()

    # Load class metadata
    metadata_path = script_dir / "audioset_tagging_cnn" / "metadata" / "class_labels_indices.csv"
    class_names = load_class_map(metadata_path)
    
    # Try to find "Fire" and "Crackle" indices
    try:
        fire_idx = class_names.index("Fire")
    except ValueError:
        fire_idx = None
    try:
        crackle_idx = class_names.index("Crackle")
    except ValueError:
        crackle_idx = None

    print(f"Using labels: Fire={fire_idx}, Crackle={crackle_idx}")

    audio_dir = script_dir / "downloads"
    
    # To simulate real-time, we chunk the audio into 1-second chunks
    chunk_size = SAMPLE_RATE * 1  # 1 second of audio at 32kHz
    
    for sample in SAMPLES:
        dest = audio_dir / f"{sample['name']}{Path(sample['url']).suffix or '.ogg'}"
        download(sample["url"], dest)

        audio = decode_audio(dest, target_sr=SAMPLE_RATE)
        
        print(f"\n=== {sample['name']} ===")
        print(f"expected: {sample['label']}")
        
        # Determine simulation bounds
        total_chunks = len(audio) // chunk_size
        if total_chunks == 0:
            total_chunks = 1
            audio = np.pad(audio, (0, chunk_size - len(audio)))
            
        print("Real-time simulation (1 second chunks):")
        for chunk_idx in range(min(total_chunks, 5)): # Test up to 5 seconds to avoid spam
            start_i = chunk_idx * chunk_size
            end_i = start_i + chunk_size
            chunk = audio[start_i:end_i]
            
            # Predict
            with torch.no_grad():
                # Model expects batch: (batch_size, samples)
                batch_audio = torch.tensor(chunk[None, :]).to(device)
                
                # Output from PANNs models is usually a dict containing 'clipwise_output'
                outputs = model(batch_audio)
                
                if isinstance(outputs, dict) and 'clipwise_output' in outputs:
                    scores = outputs['clipwise_output'].cpu().numpy()[0]
                else:
                    scores = outputs.cpu().numpy()[0]
            
            top_k = np.argsort(scores)[::-1][:5]
            
            fire_score = 0.0
            if fire_idx is not None:
                fire_score += scores[fire_idx]
            if crackle_idx is not None:
                fire_score += scores[crackle_idx]
            
            top_classes = [f"{class_names[idx]} ({scores[idx]:.4f})" for idx in top_k]
            print(f"  [Chunk {chunk_idx}] Fire score: {fire_score:.4f} | Top features: {', '.join(top_classes)}")

if __name__ == '__main__':
    main()
