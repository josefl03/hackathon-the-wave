#!/usr/bin/env python3

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


def resolve_stream_url(page_url: str) -> str:
    candidates = [
        [sys.executable, "-m", "streamlink", "--stream-url", page_url, "best"],
        [sys.executable, "-m", "yt_dlp", "-g", "-f", "bestvideo/best", page_url],
    ]

    last_error = None
    for cmd in candidates:
        if cmd[0] != sys.executable and shutil.which(cmd[0]) is None:
            continue
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            for line in result.stdout.splitlines():
                line = line.strip()
                if line:
                    return line
        except subprocess.CalledProcessError as exc:
            last_error = exc.stderr.strip() if exc.stderr else str(exc)

    raise RuntimeError(f"No se pudo resolver la URL del stream: {last_error or 'sin detalles'}")


def extract_frames(stream_url: str, out_dir: Path, interval: float, max_frames: int | None) -> list[dict[str, object]]:
    out_dir.mkdir(parents=True, exist_ok=True)
    pattern = out_dir / "frame_%06d.jpg"

    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "info",
        "-fflags",
        "nobuffer",
        "-flags",
        "low_delay",
        "-analyzeduration",
        "0",
        "-probesize",
        "32k",
        "-i",
        stream_url,
        "-an",
        "-vf",
        f"fps=1/{interval},showinfo",
        "-q:v",
        "2",
        *(["-frames:v", str(max_frames)] if max_frames is not None else []),
        str(pattern),
    ]

    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    try:
        _, stderr = proc.communicate()
    except KeyboardInterrupt:
        proc.terminate()
        raise

    if proc.returncode not in (0, None):
        raise RuntimeError(stderr.strip() or f"ffmpeg salió con código {proc.returncode}")

    frames = sorted(out_dir.glob("frame_*.jpg"))
    items = []
    for idx, frame_path in enumerate(frames):
        timestamp = round((idx + 1) * interval, 3)
        item = {
            "file": frame_path.name,
            "timestamp": timestamp,
        }
        items.append(item)

    (out_dir / "frames.json").write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return items


def main() -> int:
    parser = argparse.ArgumentParser(description="Extrae fotogramas de un live de YouTube cada N segundos")
    parser.add_argument("url", help="URL del live de YouTube")
    parser.add_argument("--output", default="output/frames", help="Directorio de salida")
    parser.add_argument("--interval", type=float, default=2.0, help="Intervalo entre fotogramas en segundos")
    parser.add_argument("--max-frames", type=int, default=None, help="Número máximo de fotogramas a extraer")
    args = parser.parse_args()

    stream_url = resolve_stream_url(args.url)
    print(f"stream url: {stream_url}")
    items = extract_frames(stream_url, Path(args.output), args.interval, args.max_frames)
    print(f"frames guardados: {len(items)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
