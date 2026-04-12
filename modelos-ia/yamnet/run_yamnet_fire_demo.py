#!/usr/bin/env python3
"""Run YAMNet on fire and non-fire sample audios.

This downloads a few public audio clips, runs YAMNet, and prints the top
classes plus a simple fire-focused score using the Fire and Crackle labels.
"""

from __future__ import annotations

import argparse
import csv
import subprocess
import sys
import urllib.request
from pathlib import Path


MODEL_URL = "https://tfhub.dev/google/yamnet/1"
CLASS_MAP_URL = (
    "https://raw.githubusercontent.com/tensorflow/models/master/"
    "research/audioset/yamnet/yamnet_class_map.csv"
)

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


def load_class_map(path: Path) -> list[str]:
    names: list[str] = []
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            names.append(row["display_name"])
    return names


def decode_audio(path: Path):
    import numpy as np

    import soundfile as sf

    try:
        audio, sr = sf.read(path, dtype="float32")
        if audio.ndim > 1:
            audio = np.mean(audio, axis=1)
        return audio.astype("float32"), sr
    except Exception:
        proc = subprocess.run(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                str(path),
                "-f",
                "f32le",
                "-acodec",
                "pcm_f32le",
                "-ac",
                "1",
                "-ar",
                "16000",
                "pipe:1",
            ],
            check=True,
            stdout=subprocess.PIPE,
        )
        return np.frombuffer(proc.stdout, dtype=np.float32), 16000


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio-dir", default="downloads", help="Where to store sample audio files")
    parser.add_argument("--top-k", type=int, default=5, help="How many top classes to print")
    args = parser.parse_args()

    audio_dir = Path(args.audio_dir)
    class_map_path = Path("yamnet_class_map.csv")
    download(CLASS_MAP_URL, class_map_path)

    print("Loading TensorFlow and YAMNet...", file=sys.stderr)
    import numpy as np
    import soundfile as sf
    import tensorflow as tf
    import tensorflow_hub as hub
    from scipy.signal import resample_poly

    model = hub.load(MODEL_URL)
    class_names = load_class_map(class_map_path)
    fire_idx = class_names.index("Fire")
    crackle_idx = class_names.index("Crackle")

    print(f"Model loaded from {MODEL_URL}")
    print(f"Using labels: Fire={fire_idx}, Crackle={crackle_idx}")

    for sample in SAMPLES:
        dest = audio_dir / f"{sample['name']}{Path(sample['url']).suffix or '.ogg'}"
        download(sample["url"], dest)

        audio, sr = decode_audio(dest)
        if sr != 16000:
            audio = resample_poly(audio, 16000, sr).astype("float32")

        scores, embeddings, spectrogram = model(audio)
        mean_scores = np.mean(scores.numpy(), axis=0)
        top_idx = np.argsort(mean_scores)[::-1][: args.top_k]
        fire_score = float((mean_scores[fire_idx] + mean_scores[crackle_idx]) / 2.0)

        print("\n===", sample["name"], "===")
        print(f"expected: {sample['label']}")
        print(f"file: {dest}")
        print(f"fire_score (Fire+Crackle avg): {fire_score:.4f}")
        for idx in top_idx:
            print(f"  {class_names[idx]:35s} {mean_scores[idx]:.4f}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
