from __future__ import annotations

import csv
import os
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from google import genai
from google.genai import types


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "fire-test-poc"
IMAGES_DIR = DATA_DIR / "images"
AUDIO_DIR = DATA_DIR / "audio"
RESULTS_CSV = DATA_DIR / "results.csv"

IMAGE_FIRE_URLS = [
    "https://raw.githubusercontent.com/VISWESWARAN1998/Fire-Detection-Dataset/master/fire/0.jpg",
    "https://raw.githubusercontent.com/VISWESWARAN1998/Fire-Detection-Dataset/master/fire/1.jpg",
    "https://raw.githubusercontent.com/VISWESWARAN1998/Fire-Detection-Dataset/master/fire/1000.jpg",
]
IMAGE_NON_FIRE_URLS = [
    "https://raw.githubusercontent.com/VISWESWARAN1998/Fire-Detection-Dataset/master/nofire/0.jpg",
    "https://raw.githubusercontent.com/VISWESWARAN1998/Fire-Detection-Dataset/master/nofire/012038.jpg",
    "https://raw.githubusercontent.com/VISWESWARAN1998/Fire-Detection-Dataset/master/nofire/02-icehouse-louisiana-coworking-office.jpg",
]
ESC50_CSV_URL = "https://raw.githubusercontent.com/karolpiczak/ESC-50/master/meta/esc50.csv"
ESC50_AUDIO_BASE = "https://raw.githubusercontent.com/karolpiczak/ESC-50/master/audio"
EMBED_MODEL = "gemini-embedding-2-preview"
QUERY_TEXT = "fire"


@dataclass
class Sample:
    kind: str
    label: str
    path: Path


def ensure_dirs() -> None:
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)


def download_image_samples() -> list[Sample]:
    samples: list[Sample] = []
    for bucket, urls in (("fire", IMAGE_FIRE_URLS), ("non_fire", IMAGE_NON_FIRE_URLS)):
        for idx, url in enumerate(urls, start=1):
            out_path = IMAGES_DIR / f"{bucket}_{idx}.jpg"
            urllib.request.urlretrieve(url, out_path)
            samples.append(Sample("image", bucket, out_path))
    return samples


def download_audio_samples() -> list[Sample]:
    csv_text = urllib.request.urlopen(ESC50_CSV_URL).read().decode("utf-8")
    rows = list(csv.DictReader(csv_text.splitlines()))
    samples: list[Sample] = []
    wanted = [
        ("fire", [r for r in rows if r["category"] == "crackling_fire"][:3]),
        ("non_fire", [r for r in rows if r["category"] in {"rain", "wind", "sea_waves"}][:3]),
    ]
    for bucket, selected in wanted:
        for idx, row in enumerate(selected, start=1):
            filename = row["filename"]
            out_path = AUDIO_DIR / f"{bucket}_{idx}_{filename}"
            url = f"{ESC50_AUDIO_BASE}/{filename}"
            urllib.request.urlretrieve(url, out_path)
            samples.append(Sample("audio", bucket, out_path))
    return samples


def cosine_similarity(a: list[float], b: list[float]) -> float:
    x = np.array(a, dtype=np.float32)
    y = np.array(b, dtype=np.float32)
    denom = float(np.linalg.norm(x) * np.linalg.norm(y))
    return float(np.dot(x, y) / denom) if denom else 0.0


def score_to_percent(score: float) -> float:
    return round(((score + 1.0) / 2.0) * 100.0, 2)


def get_client() -> genai.Client:
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY is not set")
    return genai.Client(api_key=api_key)


def embed_content(client: genai.Client, model: str, parts: list[Any]) -> list[float]:
    response = client.models.embed_content(model=model, contents=parts)
    if hasattr(response, "embedding") and response.embedding is not None:
        return list(response.embedding.values)
    if hasattr(response, "embeddings") and response.embeddings:
        return list(response.embeddings[0].values)
    raise AttributeError("Unexpected embed_content response shape")


def image_part(path: Path) -> types.Part:
    data = path.read_bytes()
    return types.Part.from_bytes(data=data, mime_type="image/jpeg")


def audio_part(path: Path) -> types.Part:
    data = path.read_bytes()
    return types.Part.from_bytes(data=data, mime_type="audio/wav")


def main() -> None:
    ensure_dirs()
    samples = download_image_samples() + download_audio_samples()

    client = get_client()
    query_embedding = embed_content(client, EMBED_MODEL, [QUERY_TEXT])

    rows = []
    for sample in samples:
        if sample.kind == "image":
            emb = embed_content(client, EMBED_MODEL, [image_part(sample.path)])
        else:
            emb = embed_content(client, EMBED_MODEL, [audio_part(sample.path)])
        sim = cosine_similarity(query_embedding, emb)
        rows.append(
            {
                "kind": sample.kind,
                "label": sample.label,
                "file": str(sample.path.relative_to(DATA_DIR)),
                "cosine_similarity": round(sim, 6),
                "fire_percent": score_to_percent(sim),
            }
        )

    with RESULTS_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {RESULTS_CSV}")


if __name__ == "__main__":
    main()
