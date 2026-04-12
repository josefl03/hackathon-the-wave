# YAMNet fire demo

This folder contains a small Python demo that downloads YAMNet, fetches public
sample audio clips, and runs inference focused on fire and crackling sounds.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run_yamnet_fire_demo.py
```

The script downloads:
- `WWS_Fireoftheforge.ogg`
- `Bones_breaking_wood_fire_ice_crackling.ogg`
- `Sound_of_rain.ogg`
- `Forest_track_2.ogg`

It prints top YAMNet labels and a simple `Fire` + `Crackle` score for each clip.
