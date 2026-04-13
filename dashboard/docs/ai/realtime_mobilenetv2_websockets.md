# Real-time MobileNetV2 with WebSockets

To enable real-time fire detection with sub-second latency from a microphone stream, we migrate from standard stateless HTTP POST polling to a persistent WebSocket stream.

## Why WebSockets?
- **Low Overhead**: Eliminates the HTTP request/response headers and connection handshake overhead on every chunk.
- **Continuous Streaming**: Clients can send a continuous flow of binary audio data (PCM or encoded bytes). 
- **Bidirectional**: The backend can instantly stream back inference results and `fire_probability` the moment a chunk is processed.

## Architecture

1. **Client Role**: The frontend accesses the microphone (`MediaRecorder` API or similar in Next.js), captures small slices (e.g., 1000ms), and sends them generically over an established `wss://` connection to `/api/ws/audio`.
2. **Backend Role (`main.py`)**: 
   - A route `@app.websocket("/api/ws/audio")` accepts the WebSocket.
   - For every incoming byte chunk, it decodes the audio and resamples it to `32000 Hz` (matching MobileNetV2 expected shape).
   - Executes `MobileNetV2` inference using the GPU under a `torch.inference_mode()` block.
   - Pushes an immediate JSON response back to the client (`await websocket.send_json(results)`).

## MobileNetV2 Details
The current model is loaded from PANNs (`audioset_tagging_cnn`) weights. It requires `32kHz` single-channel float32 audio.

```python
# Decoding audio chunks in WebSockets route snippet
while True:
    data = await websocket.receive_bytes()
    audio, sr = decode_audio_bytes(data) # Assumes standard lib functions
    
    if sr != 32000:
        audio = resample_poly(audio, 32000, sr)

    # Perform inference...
    # Send JSON response...
```

> [!TIP]
> For even lower bandwidth, clients should consider sending Float32 Arrays natively down the WebSocket instead of raw uncompressed bytes or containerized `.ogg`, though Ogg Opus natively streamed works well natively with Chrome's `MediaRecorder`.
