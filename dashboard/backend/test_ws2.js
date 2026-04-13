const WebSocket = require('ws');
const fs = require('fs');

const ws = new WebSocket('ws://[::1]:3001');

ws.on('open', () => {
    const fileData = fs.readFileSync('/home/shared/TFIA/hackathon-the-wave/modelos-ia/YOLOv8-Fire-and-Smoke-Detection/datasets/fire-8/train/images/fire1_mp4-24_jpg.rf.b4cf490293c3b92c613200d6b1a8855c.jpg');
    ws.send(fileData);
    console.log("Sent image to WS");
});

ws.on('message', (msg) => {
    console.log("Got reply:", msg.toString());
    process.exit(0);
});

ws.on('error', (err) => {
    console.error("error", err);
    process.exit(1);
});
