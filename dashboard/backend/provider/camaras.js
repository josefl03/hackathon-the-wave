const axios = require('axios');
const cheerio = require('cheerio');

// All cameras from https://es.worldcam.eu/webcams/europe/spain/aragon (pages 1 & 2)
const CAMERAS = [
  // Page 1
  { id: 'ainsa', url: 'https://es.worldcam.eu/webcams/europe/spain/7704-ainsa', name: 'Aínsa', location: 'Aínsa (Huesca)', lat: 42.4187, lng: -0.1375, tags: ['pueblo', 'naturaleza', 'aragon'] },
  { id: 'aisa-calle-alta', url: 'https://es.worldcam.eu/webcams/europe/spain/33505-aisa-calle-alta', name: 'Aísa - Calle Alta', location: 'Aísa (Huesca)', lat: 42.7241, lng: -0.5461, tags: ['pueblo', 'calle', 'aragon'] },
  { id: 'aisa-vista-panoramica', url: 'https://es.worldcam.eu/webcams/europe/spain/33506-aisa-vista-panoramica', name: 'Aísa - Vista panorámica', location: 'Aísa (Huesca)', lat: 42.7241, lng: -0.5461, tags: ['panoramica', 'naturaleza', 'aragon'] },
  { id: 'albarracin-plaza-mayor', url: 'https://es.worldcam.eu/webcams/europe/spain/12024-albarracin-plaza-mayor', name: 'Albarracín - Plaza Mayor', location: 'Albarracín (Teruel)', lat: 40.4107, lng: -1.4394, tags: ['plaza', 'pueblo', 'aragon'] },
  { id: 'albentosa-vista-panoramica', url: 'https://es.worldcam.eu/webcams/europe/spain/26467-albentosa-vista-panoramica', name: 'Albentosa - Vista panorámica', location: 'Albentosa (Teruel)', lat: 40.0576, lng: -0.8208, tags: ['panoramica', 'naturaleza', 'aragon'] },
  { id: 'alcala-de-la-selva-castillo', url: 'https://es.worldcam.eu/webcams/europe/spain/17804-alcala-de-la-selva-castillo', name: 'Alcalá de la Selva - Castillo', location: 'Alcalá de la Selva (Teruel)', lat: 40.3873, lng: -0.6918, tags: ['castillo', 'vigilancia', 'aragon'] },
  { id: 'alcala-selva-golf', url: 'https://es.worldcam.eu/webcams/europe/spain/33328-alcala-de-la-selva-campo-de-golf-el-castillejo', name: 'Alcalá de la Selva - Golf El Castillejo', location: 'Alcalá de la Selva (Teruel)', lat: 40.3873, lng: -0.6918, tags: ['golf', 'deportes', 'aragon'] },
  { id: 'aliaga-vista-panoramica', url: 'https://es.worldcam.eu/webcams/europe/spain/32699-aliaga-vista-panoramica', name: 'Aliaga - Vista panorámica', location: 'Aliaga (Teruel)', lat: 40.6670, lng: -0.7067, tags: ['panoramica', 'naturaleza', 'aragon'] },
  { id: 'barbastro-vista-panoramica', url: 'https://es.worldcam.eu/webcams/europe/spain/28444-barbastro-vista-panoramica', name: 'Barbastro - Vista panorámica', location: 'Barbastro (Huesca)', lat: 42.0344, lng: 0.1263, tags: ['panoramica', 'ciudad', 'aragon'] },
  { id: 'benasque-llanos-del-hospital', url: 'https://es.worldcam.eu/webcams/europe/spain/30811-benasque-llanos-del-hospital', name: 'Benasque - Llanos del Hospital', location: 'Benasque (Huesca)', lat: 42.6014, lng: 0.5219, tags: ['montana', 'naturaleza', 'aragon'] },
  { id: 'bielsa-tunel', url: 'https://es.worldcam.eu/webcams/europe/spain/32084-bielsa-aragnouet-fr-tunel', name: 'Bielsa - Túnel Aragnouet', location: 'Bielsa (Huesca)', lat: 42.6407, lng: 0.2141, tags: ['tunel', 'trafico', 'aragon'] },
  { id: 'bielsa-camping', url: 'https://es.worldcam.eu/webcams/europe/spain/30828-bielsa-complejo-turistico-camping-bielsa', name: 'Bielsa - Camping Bielsa', location: 'Bielsa (Huesca)', lat: 42.6272, lng: 0.2130, tags: ['camping', 'naturaleza', 'aragon'] },
  { id: 'bielsa-camping-pineta', url: 'https://es.worldcam.eu/webcams/europe/spain/32083-bielsa-espierba-camping-pineta', name: 'Bielsa - Espierba Camping Pineta', location: 'Bielsa (Huesca)', lat: 42.6500, lng: 0.1800, tags: ['camping', 'naturaleza', 'aragon'] },
  { id: 'broto-hotel-pradas-ordesa', url: 'https://es.worldcam.eu/webcams/europe/spain/8703-broto-hotel-pradas-ordesa', name: 'Broto - Hotel Pradas Ordesa', location: 'Broto (Huesca)', lat: 42.5969, lng: -0.1278, tags: ['hotel', 'naturaleza', 'aragon'] },
  { id: 'cabra-de-mora-plaza-mayor', url: 'https://es.worldcam.eu/webcams/europe/spain/24976-cabra-de-mora-plaza-mayor', name: 'Cabra de Mora - Plaza Mayor', location: 'Cabra de Mora (Teruel)', lat: 40.1628, lng: -0.8289, tags: ['plaza', 'pueblo', 'aragon'] },
  { id: 'canada-vellida', url: 'https://es.worldcam.eu/webcams/europe/spain/36200-canada-vellida-vista-panoramica', name: 'Cañada Vellida - Vista panorámica', location: 'Cañada Vellida (Teruel)', lat: 40.4833, lng: -0.7500, tags: ['panoramica', 'naturaleza', 'aragon'] },
  { id: 'candanchu-esqui-1', url: 'https://es.worldcam.eu/webcams/europe/spain/34611-candanchu-estacion-de-esqui', name: 'Candanchú - Estación de esquí (1)', location: 'Candanchú (Huesca)', lat: 42.7787, lng: -0.5224, tags: ['esqui', 'montana', 'aragon'] },
  { id: 'candanchu-esqui-2', url: 'https://es.worldcam.eu/webcams/europe/spain/37172-candanchu-estacion-de-esqui', name: 'Candanchú - Estación de esquí (2)', location: 'Candanchú (Huesca)', lat: 42.7787, lng: -0.5224, tags: ['esqui', 'montana', 'aragon'] },
  { id: 'canfranc-estacion', url: 'https://es.worldcam.eu/webcams/europe/spain/6702-canfranc-estacion', name: 'Canfranc - Estación', location: 'Canfranc (Huesca)', lat: 42.7476, lng: -0.5222, tags: ['estacion', 'patrimonio', 'aragon'] },
  { id: 'castejon-de-sos', url: 'https://es.worldcam.eu/webcams/europe/spain/28003-castejon-de-sos', name: 'Castejón de Sos', location: 'Castejón de Sos (Huesca)', lat: 42.5453, lng: 0.4959, tags: ['pueblo', 'naturaleza', 'aragon'] },
  { id: 'el-castellar', url: 'https://es.worldcam.eu/webcams/europe/spain/26150-el-castellar-vista-panoramica', name: 'El Castellar - Vista panorámica', location: 'El Castellar (Teruel)', lat: 40.3450, lng: -0.9180, tags: ['panoramica', 'naturaleza', 'aragon'] },
  { id: 'el-pobo-hoyalta', url: 'https://es.worldcam.eu/webcams/europe/spain/30021-el-pobo-hoyalta', name: 'El Pobo - Hoyalta', location: 'El Pobo (Teruel)', lat: 40.5267, lng: -0.6917, tags: ['naturaleza', 'panoramica', 'aragon'] },
  { id: 'fiscal-camping-el-jabali', url: 'https://es.worldcam.eu/webcams/europe/spain/32948-fiscal-camping-el-jabali-blanco', name: 'Fiscal - Camping El Jabalí Blanco', location: 'Fiscal (Huesca)', lat: 42.4883, lng: -0.1463, tags: ['camping', 'naturaleza', 'aragon'] },
  { id: 'formiche-alto', url: 'https://es.worldcam.eu/webcams/europe/spain/27369-formiche-alto-vista-panoramica', name: 'Formiche Alto - Vista panorámica', location: 'Formiche Alto (Teruel)', lat: 40.2333, lng: -0.7833, tags: ['panoramica', 'naturaleza', 'aragon'] },
  { id: 'formigal', url: 'https://es.worldcam.eu/webcams/europe/spain/10546-formigal', name: 'Formigal', location: 'Formigal (Huesca)', lat: 42.7678, lng: -0.3745, tags: ['esqui', 'montana', 'aragon'] },
  // Page 2
  { id: 'fortanete-plaza-espana', url: 'https://es.worldcam.eu/webcams/europe/spain/24982-fortanete-plaza-espana', name: 'Fortanete - Plaza España', location: 'Fortanete (Teruel)', lat: 40.4981, lng: -0.5386, tags: ['plaza', 'pueblo', 'aragon'] },
  { id: 'gudar-vista', url: 'https://es.worldcam.eu/webcams/europe/spain/24981-gudar-vista-panoramica', name: 'Gúdar - Vista panorámica', location: 'Gúdar (Teruel)', lat: 40.3083, lng: -0.6753, tags: ['panoramica', 'naturaleza', 'aragon'] },
  { id: 'huesca-abba-hotel', url: 'https://es.worldcam.eu/webcams/europe/spain/37737-huesca-abba-huesca-hotel', name: 'Huesca - Abba Hotel', location: 'Huesca (Huesca)', lat: 42.1361, lng: -0.4083, tags: ['hotel', 'ciudad', 'aragon'] },
  { id: 'huesca-plaza-navarra', url: 'https://es.worldcam.eu/webcams/europe/spain/8054-huesca-fuente-de-las-musas-en-la-plaza-de-navarra', name: 'Huesca - Plaza de Navarra', location: 'Huesca (Huesca)', lat: 42.1361, lng: -0.4083, tags: ['plaza', 'ciudad', 'aragon'] },
  { id: 'jaca-panoramica', url: 'https://es.worldcam.eu/webcams/europe/spain/21802-jaca-vista-panoramica', name: 'Jaca - Vista panorámica', location: 'Jaca (Huesca)', lat: 42.5700, lng: -0.5506, tags: ['panoramica', 'ciudad', 'aragon'] },
  { id: 'miravete-de-la-sierra', url: 'https://es.worldcam.eu/webcams/europe/spain/35402-miravete-de-la-sierra-vista-panoramica', name: 'Miravete de la Sierra - Panorámica', location: 'Miravete de la Sierra (Teruel)', lat: 40.5833, lng: -0.5833, tags: ['panoramica', 'pueblo', 'aragon'] },
  { id: 'monteagudo-castillo', url: 'https://es.worldcam.eu/webcams/europe/spain/27009-monteagudo-del-castillo-plaza-mayor', name: 'Monteagudo del Castillo - Plaza Mayor', location: 'Monteagudo del Castillo (Teruel)', lat: 40.4558, lng: -0.6386, tags: ['plaza', 'pueblo', 'aragon'] },
  { id: 'mora-de-rubielos', url: 'https://es.worldcam.eu/webcams/europe/spain/25334-mora-de-rubielos-vista-panoramica', name: 'Mora de Rubielos - Panorámica', location: 'Mora de Rubielos (Teruel)', lat: 40.2547, lng: -0.7494, tags: ['panoramica', 'pueblo', 'aragon'] },
  { id: 'orihuela-del-tremedal', url: 'https://es.worldcam.eu/webcams/europe/spain/28787-orihuela-del-tremedal-vista-panoramica', name: 'Orihuela del Tremedal - Panorámica', location: 'Orihuela del Tremedal (Teruel)', lat: 40.5481, lng: -1.6531, tags: ['panoramica', 'naturaleza', 'aragon'] },
  { id: 'pancrudo', url: 'https://es.worldcam.eu/webcams/europe/spain/36199-pancrudo-vista-panoramica', name: 'Pancrudo - Vista panorámica', location: 'Pancrudo (Teruel)', lat: 40.6333, lng: -0.9833, tags: ['panoramica', 'naturaleza', 'aragon'] },
  { id: 'panticosa-balneario', url: 'https://es.worldcam.eu/webcams/europe/spain/37772-panticosa-balneario-de-panticosa', name: 'Panticosa - Balneario', location: 'Panticosa (Huesca)', lat: 42.7186, lng: -0.2831, tags: ['montana', 'naturaleza', 'aragon'] },
  { id: 'puertomingalvo', url: 'https://es.worldcam.eu/webcams/europe/spain/27815-puertomingalvo-vista-panoramica', name: 'Puertomingalvo - Vista panorámica', location: 'Puertomingalvo (Teruel)', lat: 40.3719, lng: -0.2994, tags: ['panoramica', 'pueblo', 'aragon'] },
  { id: 'san-agustin-calle-mayor', url: 'https://es.worldcam.eu/webcams/europe/spain/25550-san-agustin-calle-mayor', name: 'San Agustín - Calle Mayor', location: 'San Agustín (Teruel)', lat: 40.1833, lng: -0.7500, tags: ['calle', 'pueblo', 'aragon'] },
  { id: 'san-esteban-litera', url: 'https://es.worldcam.eu/webcams/europe/spain/29747-san-esteban-de-litera-plaza-espana', name: 'San Esteban de Litera - Plaza España', location: 'San Esteban de Litera (Huesca)', lat: 41.9117, lng: 0.3983, tags: ['plaza', 'pueblo', 'aragon'] },
  { id: 'santa-cilia-aeropuerto', url: 'https://es.worldcam.eu/webcams/europe/spain/9753-santa-cilia-aeropuerto', name: 'Santa Cilia - Aeropuerto', location: 'Santa Cilia (Huesca)', lat: 42.5978, lng: -0.6036, tags: ['aeropuerto', 'trafico', 'aragon'] },
  { id: 'sarrion-plaza-espana', url: 'https://es.worldcam.eu/webcams/europe/spain/25097-sarrion-plaza-de-espana', name: 'Sarrión - Plaza de España', location: 'Sarrión (Teruel)', lat: 40.1447, lng: -0.8228, tags: ['plaza', 'pueblo', 'aragon'] },
  { id: 'torrijas-sierra-javalambre', url: 'https://es.worldcam.eu/webcams/europe/spain/26959-torrijas-sierra-de-javalambre', name: 'Torrijas - Sierra de Javalambre', location: 'Torrijas (Teruel)', lat: 40.1806, lng: -0.9714, tags: ['sierra', 'naturaleza', 'aragon'] },
  { id: 'valdelinares-panoramica', url: 'https://es.worldcam.eu/webcams/europe/spain/25551-valdelinares-vista-panoramica', name: 'Valdelinares - Vista panorámica', location: 'Valdelinares (Teruel)', lat: 40.4167, lng: -0.5833, tags: ['panoramica', 'montana', 'aragon'] },
  { id: 'valdelinares-cota-1900', url: 'https://es.worldcam.eu/webcams/europe/spain/20304-valdelinares-valdelinares-cota-1900', name: 'Valdelinares - Cota 1.900', location: 'Valdelinares (Teruel)', lat: 40.4167, lng: -0.5833, tags: ['esqui', 'montana', 'aragon'] },
  { id: 'zaragoza-pilar', url: 'https://es.worldcam.eu/webcams/europe/spain/1300-zaragoza-catedral-basilica-de-nuestra-senora-del-pilar-rio-ebro-y-puente-de-santiago', name: 'Zaragoza - Catedral Basílica del Pilar', location: 'Zaragoza (Zaragoza)', lat: 41.6561, lng: -0.8773, tags: ['catedral', 'ciudad', 'aragon', 'patrimonio'] },
];

let cacheData = null;

async function extractStreamUrl(cameraUrl) {
  try {
    const response = await axios.get(cameraUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Look for video/stream elements
    const videoSrc = $('video source').attr('src') || 
                     $('iframe').attr('src') ||
                     $('[data-stream]').attr('data-stream') ||
                     $('meta[property="og:image"]').attr('content') ||
                     null;

    return videoSrc || null;
  } catch (error) {
    console.warn(`[Cameras] Failed to extract stream from ${cameraUrl}:`, error.message);
    return null;
  }
}

async function fetchCameras() {
  console.log('[Cameras] Fetching camera streams...');
  try {
    const camerasWithStreams = [];
    const chunkSize = 5;
    
    for (let i = 0; i < CAMERAS.length; i += chunkSize) {
      const chunk = CAMERAS.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (cam) => {
          console.log(`  → Extracting ${cam.id}`);
          const stream_url = await extractStreamUrl(cam.url);
          
          return {
            ...cam,
            stream_url: stream_url || cam.url,
            available: stream_url !== null
          };
        })
      );
      camerasWithStreams.push(...chunkResults);
    }

    const available = camerasWithStreams.filter(c => c.available);
    console.log(`[Cameras] Got ${available.length}/${camerasWithStreams.length} active cameras`);
    
    // Cache result
    cacheData = camerasWithStreams;
    return camerasWithStreams;
  } catch (error) {
    console.error('[Cameras] Error:', error.message);
    
    // Return known cameras even if stream extraction failed
    if (!cacheData) {
      cacheData = CAMERAS.map(cam => ({
        ...cam,
        stream_url: cam.url,
        available: false
      }));
    }
    return cacheData;
  }
}

function getCameras() {
  return cacheData;
}

module.exports = {
  fetchCameras,
  getCameras
};
