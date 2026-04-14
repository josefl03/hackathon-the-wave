const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const axios = require('axios');
const { WebSocketServer } = require('ws');
const camarasProvider = require('./provider/camaras');
const camarasDgtProvider = require('./provider/camaras_dgt');
const sensoresProvider = require('./provider/sensores');
const microfonosProvider = require('./provider/microfonos');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API endpoints can be added here
app.get('/api/status', (req, res) => {
    res.json({ status: 'Backend is running', timestamp: new Date() });
});

// Camera endpoints
app.get('/api/cameras', (req, res) => {
    const worldcam = camarasProvider.getCameras() || [];
    const dgt = camarasDgtProvider.getCameras() || [];
    res.json([...worldcam, ...dgt]);
});

// Sensor endpoints
app.get('/api/sensores', (req, res) => {
    res.json(sensoresProvider.getSensores() || []);
});

// Microphone endpoints
app.get('/api/microfonos', (req, res) => {
    res.json(microfonosProvider.getMicrofonos() || []);
});

// Camera image proxy — avoids CORS issues when loading camera images in the frontend
app.get('/api/proxy/camera', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'Missing url query parameter' });
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const contentType = response.headers['content-type'] || 'image/jpeg';
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=30');
        res.send(Buffer.from(response.data));
    } catch (error) {
        console.error('[Proxy] Error proxying camera:', error.message);
        res.status(502).json({ error: 'Failed to fetch camera image' });
    }
});

// Background fetching
camarasProvider.fetchCameras();
camarasDgtProvider.fetchDGTCameras();
setInterval(() => camarasProvider.fetchCameras(), 10 * 60 * 1000); // every 10 min
setInterval(() => camarasDgtProvider.fetchDGTCameras(), 10 * 60 * 1000); // every 10 min

sensoresProvider.fetchSensores();
setInterval(() => sensoresProvider.fetchSensores(), 10 * 60 * 1000); // every 10 min

microfonosProvider.fetchMicrofonos();
setInterval(() => microfonosProvider.fetchMicrofonos(), 1 * 60 * 1000); // every 1 min

const server = http.createServer(app);

// Initialize WebSocket server instance
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket for video stream');

    ws.on('message', async (message) => {
        try {
            // message is a Buffer. Check headers to distinguish image vs audio.
            // JPEG starts with 0xFF 0xD8. 
            // WebM (MediaRecorder default) starts with 0x1A 0x45 0xDF 0xA3 (EBML)
            const isJpeg = message[0] === 0xFF && message[1] === 0xD8;
            
            if (isJpeg) {
                // Video frame processing
                const blob = new Blob([message], { type: 'image/jpeg' });
                const formData = new FormData();
                formData.append('file', blob, 'frame.jpg');

                const aiUrl = 'http://127.0.0.1:8001/api/inference/image';
                const response = await fetch(aiUrl, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`AI Backend (Image) returned ${response.status}: ${text}`);
                }

                const data = await response.json();
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'inference_result',
                        latency_sec: data.latency_sec,
                        detections: data.detections || [],
                    }));
                }
            } else {
                // Assume Audio chunk (EBML/WebM or WAV)
                const blob = new Blob([message], { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('file', blob, 'audio.webm');

                const aiUrl = 'http://127.0.0.1:8001/api/inference/audio';
                const response = await fetch(aiUrl, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`AI Backend (Audio) returned ${response.status}: ${text}`);
                }

                const data = await response.json();
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'audio_inference_result',
                        latency_sec: data.latency_sec,
                        fire_probability: data.fire_probability,
                        top_classes: data.top_classes || [],
                    }));
                }
            }

        } catch (error) {
            console.error('Error processing message:', error.message);
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: 'error', message: error.message }));
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
    });
});

server.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});
