/**
 * Fetcher: Calidad del Aire - Aragón
 * Real API: https://opendata.aragon.es/GA_OD_Core/download
 *   resource_id=325 → estaciones (GeoJSON)
 *   resource_id=326 → mediciones horarias (JSON array)
 */

import axios from 'axios';
import { normalizeResponse, normalizeError } from '../utils/normalize.js';
import Cache from '../utils/cache.js';

const STATIONS_URL   = 'https://opendata.aragon.es/GA_OD_Core/download?resource_id=325&formato=json';
const MEASUREMENTS_URL = 'https://opendata.aragon.es/GA_OD_Core/download?resource_id=326&formato=json';

// Zaragoza city station IDs (from resource 325)
const ZARAGOZA_STATION_IDS = new Set([
  50297026, 50297029, 50297032,
  50297036, 50297037, 50297038,
  50297039, 50297040
]);

const cache = new Cache(5 * 60 * 1000); // 5 min cache
const CACHE_KEY = 'calidad_aire';

async function fetchAirQuality() {
  try {
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      console.error('[AirQuality] Cache hit');
      return normalizeResponse('calidad_aire_aragon', cached, 'ok');
    }

    console.error('[AirQuality] Fetching stations + measurements from Aragón Open Data');

    const [stationsResp, measurementsResp] = await Promise.all([
      axios.get(STATIONS_URL,     { timeout: 15000 }),
      axios.get(MEASUREMENTS_URL, { timeout: 30000 })
    ]);

    // Build station name map  id → name
    const stationNames = {};
    for (const f of (stationsResp.data?.features ?? [])) {
      stationNames[f.properties?.id] = f.properties?.name;
    }

    // Keep only Zaragoza city stations and get latest reading per station + magnitude
    const latest = {}; // key: `${id}_${magnitud}`
    for (const r of measurementsResp.data) {
      if (!ZARAGOZA_STATION_IDS.has(r.id)) continue;
      const key = `${r.id}_${r.magnitud}`;
      if (!latest[key] || r.fechahora > latest[key].fechahora) {
        latest[key] = r;
      }
    }

    // Group by station
    const byStation = {};
    for (const r of Object.values(latest)) {
      if (!byStation[r.id]) {
        byStation[r.id] = {
          station_id:  r.id,
          station_name: stationNames[r.id] ?? String(r.id),
          timestamp:   r.fechahora,
          NO2: null, O3: null, PM10: null, 'PM2.5': null, SO2: null
        };
      }
      const val = parseFloat(r.valor_medido);
      byStation[r.id][r.magnitud] = isNaN(val) ? null : val;
      // Keep latest timestamp
      if (r.fechahora > byStation[r.id].timestamp) {
        byStation[r.id].timestamp = r.fechahora;
      }
    }

    const result = Object.values(byStation);
    console.error(`[AirQuality] Got ${result.length} Zaragoza stations with data`);

    cache.set(CACHE_KEY, result);
    return normalizeResponse('calidad_aire_aragon', result, 'ok');

  } catch (error) {
    console.error('[AirQuality] Error:', error.message);

    // Fallback with static placeholder so dashboard always has something
    const fallback = [{
      station_id:   50297038,
      station_name: 'CENTRO',
      timestamp:    new Date().toISOString(),
      NO2: null, O3: null, PM10: null, 'PM2.5': null, SO2: null,
      source: 'fallback'
    }];

    return normalizeResponse('calidad_aire_aragon', fallback, 'partial', `Fallback – ${error.message}`);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await fetchAirQuality();
  console.log(JSON.stringify(result, null, 2));
}

export default fetchAirQuality;

