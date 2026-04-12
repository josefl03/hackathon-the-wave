# Fire similarity POC

This folder contains a small proof-of-concept that:

1. Downloads a tiny fire vs non-fire image set and fire vs non-fire audio set.
2. Runs Gemini Embedding 2 (`gemini-embedding-2-preview`) on text, images, and audio.
3. Compares each sample to the text `fire` with cosine similarity.

## Sources

- Images: `VISWESWARAN1998/Fire-Detection-Dataset` fire and nofire folders
- Audio: `karolpiczak/ESC-50` crackling_fire, rain, wind, and sea_waves clips
- Model info: https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-embedding-2/

## Notes

The script downloads a fixed 6-image and 6-audio sample set, then scores each item against the text `fire` using cosine similarity.

## Output

The script writes files to `data/fire-test-poc/` and saves results to `results.csv`.

## Run

Set `GOOGLE_API_KEY`, then run:

```bash
python fire_similarity_poc.py
```
