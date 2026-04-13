const axios = require('axios');

let cacheData = [];

async function fetchDGTCameras() {
  console.log('[DGT Cameras] Fetching from DGT API...');
  try {
    const response = await axios.get('https://www.dgt.es/.content/.assets/json/camaras.json', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const allData = response.data;
    if (!Array.isArray(allData)) {
      throw new Error('DGT camera data is not an array');
    }

    // Filter Zaragoza (provincia === "50")
    const zgzCameras = allData.filter(c => c.provincia === "50");
    console.log(`[DGT Cameras] Found ${zgzCameras.length} cameras for Zaragoza`);

    const mappedCameras = zgzCameras.map(cam => ({
      id: `dgt-${cam.id}`,
      name: `DGT: ${cam.carretera} PK ${cam.pk} (${cam.sentido})`,
      location: 'Zaragoza (DGT)',
      lat: parseFloat(cam.latitud),
      lng: parseFloat(cam.longitud),
      stream_url: cam.imagen,
      available: true,
      tags: ['dgt', 'trafico', cam.carretera.toLowerCase(), 'zaragoza']
    }));

    cacheData = mappedCameras;
    return cacheData;
  } catch (error) {
    console.error('[DGT Cameras] Error fetching:', error.message);
    return cacheData; // Return old cache if fails
  }
}

function getCameras() {
  return cacheData;
}

module.exports = {
  fetchDGTCameras,
  getCameras
};
