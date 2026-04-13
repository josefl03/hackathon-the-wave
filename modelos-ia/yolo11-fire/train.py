#!/usr/bin/env python3
"""
Fine-tune YOLO11n on the fire-8 dataset.
Outputs: modelos-ia/yolo11-fire/runs/detect/train/weights/best.pt
"""
from ultralytics import YOLO
from pathlib import Path

DATA_YAML  = "/home/shared/TFIA/hackathon-the-wave/modelos-ia/yolo11-fire/data.yaml"
OUTPUT_DIR = "/home/shared/TFIA/hackathon-the-wave/modelos-ia/yolo11-fire"

model = YOLO("yolo11n.pt")   # downloads ~6 MB pretrained backbone if not cached

results = model.train(
    data=DATA_YAML,
    epochs=30,           # low epochs to finish faster without GPU
    imgsz=640,
    batch=8,
    project=OUTPUT_DIR,
    name="train",
    exist_ok=True,
    patience=7,          # early stop if no improvement after 7 epochs
    device="cpu",
    workers=4,
    verbose=True,
    # Data augmentation tuned for fire images
    flipud=0.1,
    fliplr=0.5,
    hsv_h=0.015,
    hsv_s=0.7,
    hsv_v=0.4,
)

best_pt = Path(OUTPUT_DIR) / "train" / "weights" / "best.pt"
print(f"\n✅ Training complete! Best weights saved to: {best_pt}")
