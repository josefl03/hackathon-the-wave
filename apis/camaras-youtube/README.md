# camaras-youtube

Extracción de fotogramas de un live de YouTube con baja latencia local.

## Uso

```bash
python3 -m pip install -r requirements.txt
python3 scripts/extract_live_frames.py "https://www.youtube.com/watch?v=qQ8BaejUlqU" --output output/frames --interval 2
```

## Salida

- `output/frames/frame_000001.jpg`
- `output/frames/frame_000002.jpg`
