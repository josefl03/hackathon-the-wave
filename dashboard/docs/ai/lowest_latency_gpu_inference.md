# Lowest Latency Local GPU Inference with MobileNetV2

Achieving real-time, low latency GPU inference involves moving audio pipelines onto the GPU and preventing synchronization overheads between the CPU and the GPU.

## Key Techniques

### 1. `torch.inference_mode()` vs `torch.no_grad()`
While `torch.no_grad()` prevents PyTorch from allocating memory to store forward graphs for backward propagation, `torch.inference_mode()` is the exact optimal analog designed strictly for inferencing. It entirely bypasses version tracking on tensors, shaving off milliseconds from small forward passes like those in MobileNetV2.

```python
import torch

with torch.inference_mode():
    outputs = model(batch_audio)
```

### 2. Eliminating Device Synchronization
Transferring data between host CPU memory to GPU PCIe (`.to('cuda')`) takes time. In streaming cases, keeping a single fixed tensor buffer living purely on the GPU and only overwriting it with incoming chunks is theoretically fastest, but the standard approach of dynamically moving chunks `torch.tensor(chunk).to('cuda')` only adds microseconds. 

### 3. Model Warm-up
The first forward pass of a PyTorch model dynamically provisions memory allocations. We must perform a dummy "warm-up" pass inside our FastApi `@app.on_event("startup")` function with a dummy matrix data:

```python
dummy_audio = torch.zeros((1, 32000)).to('cuda')
with torch.inference_mode():
    _ = model(dummy_audio)
```
This forces PyTorch to execute its initial overhead before any actual payload arrives via WebSocket.

### 4. Precision Tuning
By default, MobileNetV2 weights are Floating Point 32-bit (FP32). Switching to Half-Precision (FP16) using `.half()` cuts model sizes, memory operations, and tensor-core calculations down.

```python
model = model.half().to('cuda')
```
*Note: Audio arrays must be cast to `.half()` (i.e. `float16`) before passing into the half-precision model.* MobileNetV2 is natively small, so the gains of FP16 vs FP32 for a single batch are marginal on powerful GPUs (e.g., RTX 4090), but highly recommended on edge devices (Jetson).

## End-to-End Latency Target
Coupling WebSockets with `torch.inference_mode()` and Warm-up should drop standard inference times for a 1-second chunk below `<25ms` locally.
