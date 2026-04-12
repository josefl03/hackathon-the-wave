# Inferencia YOLOv8 Fire and Smoke

## Objetivo
Ejecutar inferencia sobre una sola muestra usando pesos ya entrenados, sin reentrenar el modelo.

## Dependencias
El `README.md` indica estas dependencias mínimas:
- `ultralytics`
- `roboflow`

## Entorno
Se creó un entorno virtual local con `uv`:

```bash
uv venv .venv
uv pip install ultralytics roboflow
```

## Modelo usado
Se reutilizaron los pesos ya entrenados del repositorio:

- `runs/detect/train/weights/best.pt`

## Muestra usada
Se ejecutó inferencia sobre una sola imagen del conjunto de prueba:

- `datasets/fire-8/test/images/test3_mp4-11_jpg.rf.28789b80d7865ebacdcb4e43db0975fc.jpg`

## Comando de inferencia
```bash
./.venv/bin/yolo task=detect mode=predict \
  model=runs/detect/train/weights/best.pt \
  conf=0.25 \
  source=datasets/fire-8/test/images/test3_mp4-11_jpg.rf.28789b80d7865ebacdcb4e43db0975fc.jpg \
  save=True
```

## Resultado
La salida se guardó en:

- `runs/detect/predict3/test3_mp4-11_jpg.rf.28789b80d7865ebacdcb4e43db0975fc.jpg`

La ejecución detectó `1 smoke`.
