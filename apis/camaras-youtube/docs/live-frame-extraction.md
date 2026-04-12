# Extracción de frames en tiempo real

## Flujo

1. Resolver la URL directa del live con `streamlink` o `yt-dlp`.
2. Abrir el stream con `PyAV` en modo de baja latencia.
3. Decodificar frames según llegan y guardar uno cada `2s`.

## Dependencias

- Python 3
- `ffmpeg`/`ffprobe`
- `av` (`PyAV`)
- `Pillow`
- `yt-dlp` o `streamlink`

## Uso

```bash
python3 -m pip install -r requirements.txt
python3 scripts/extract_live_frames.py "https://www.youtube.com/watch?v=qQ8BaejUlqU" --output output/frames --interval 2
```

## Salida

- Las imágenes se guardan como `output/frames/frame_000001.jpg`, `frame_000002.jpg`, etc.

## Nota

- Esto reduce la latencia local, pero no elimina la latencia inherente de YouTube Live.
