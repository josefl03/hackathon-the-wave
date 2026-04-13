/**
 * Fetcher: Sensores GeoJSON - Islas de Calor Zaragoza
 * URL: https://www.zaragoza.es/contenidos/medioambiente/islascalor/sensores_islas.geojson
 */

import axios from 'axios';
import { normalizeResponse, normalizeError, parseGeoJSONSensores } from '../utils/normalize.js';
import Cache from '../utils/cache.js';

const SENSOR_URL = 'https://www.zaragoza.es/contenidos/medioambiente/islascalor/sensores_islas.geojson';
const cache = new Cache(60 * 60 * 1000); // 1 hour cache
const CACHE_KEY = 'sensores_geojson';

async function fetchSensores() {
  try {
    // Check cache
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      console.log('[Sensores] Cache hit');
      return normalizeResponse('sensores_islas', cached, 'ok', null);
    }

    console.log('[Sensores] Fetching from', SENSOR_URL);
    const response = await axios.get(SENSOR_URL, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const geojson = response.data;
    const sensors = parseGeoJSONSensores(geojson);
    
    console.log(`[Sensores] Got ${sensors.length} sensors`);
    
    // Cache result
    cache.set(CACHE_KEY, sensors);
    
    return normalizeResponse('sensores_islas', sensors, 'ok');
  } catch (error) {
    console.error('[Sensores] Error:', error.message);
    return normalizeError('sensores_islas', error);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await fetchSensores();
  console.log(JSON.stringify(result, null, 2));
}

export default fetchSensores;
