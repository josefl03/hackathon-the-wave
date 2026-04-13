const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API endpoints can be added here
app.get('/api/status', (req, res) => {
    res.json({ status: 'Backend is running', timestamp: new Date() });
});

// For demonstration, you could serve the Next.js static files if built
// app.use(express.static(path.join(__dirname, '../frontend/out')));

app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});
