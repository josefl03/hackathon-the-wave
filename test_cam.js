const { fetchCameras } = require('./dashboard/backend/provider/camaras.js');
fetchCameras().then(res => console.log(res.slice(0, 3))).catch(console.error);
