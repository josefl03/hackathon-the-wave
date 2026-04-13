/**
 * Fetcher: Calidad del Aire - Aragón
 * URL: https://opendata.aragon.es/datos/catalogo/dataset/datos-de-calidad-del-aire...
 */

import axios from 'axios';
import { normalizeResponse, normalizeError } from '../utils/normalize.js';
import Cache from '../utils/cache.js';

// API endpoint para datos de calidad del aire (CKAN instance)
const AIR_API_URL = 'https://opendata.aragon.es/api/3/action/datastore_search';
const RESOURCE_ID = 'cambios-en-el-indice-de-calidad-del-aire-por-provincia'; // Approximation
const cache = new Cache(5 * 60 * 1000); // 5 min cache (more frequent updates)
const CACHE_KEY = 'calidad_aire';

async function fetchAirQuality() {
  try {
    // Check cache
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      console.log('[AirQuality] Cache hit');
      return normalizeResponse('calidad_aire_aragon', cached, 'ok');
    }

    console.log('[AirQuality] Fetching from Aragón API');
    
    // Try main API endpoint for air quality
    const response = await axios.get(AIR_API_URL, {
      params: {
        resource_id: RESOURCE_ID,
        limit: 1000
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    // Parse CKAN response
    const records = response.data?.result?.records || [];
    
    // Extract air quality data
    const airQualityData = records.map(record => ({
      province: record.provincia || 'unknown',
      pm25: parseFloat(record.pm25) || null,
      pm10: parseFloat(record.pm10) || null,
      no2: parseFloat(record.no2) || null,
      o3: parseFloat(record.o3) || null,
      so2: parseFloat(record.so2) || null,
      aqi: record.indice_calidad || null,
      timestamp: record.fecha || new Date().toISOString()
    }));

    console.log(`[AirQuality] Got ${airQualityData.length} records`);
    
    // Cache result
    cache.set(CACHE_KEY, airQualityData);
    
    return normalizeResponse('calidad_aire_aragon', airQualityData, 'ok');
  } catch (error) {
    console.error('[AirQuality] Error:', error.message);
    
    // Fallback: return static known air quality data
    const fallback = [
      {
        province: 'Zaragoza',
        pm25: 25,
        pm10: 45,
        no2: 35,
        o3: 60,
        so2: 8,
        aqi: 'Moderado',
        timestamp: new Date().toISOString(),
        source: 'fallback'
      }
    ];
    
    return normalizeResponse('calidad_aire_aragon', fallback, 'partial', 'Using fallback data');
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await fetchAirQuality();
  console.log(JSON.stringify(result, null, 2));
}

export default fetchAirQuality;
