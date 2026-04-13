const axios = require('axios');

const STATIONS_URL   = 'https://opendata.aragon.es/GA_OD_Core/download?resource_id=325&formato=json';
const MEASUREMENTS_URL = 'https://opendata.aragon.es/GA_OD_Core/download?resource_id=326&formato=json';

// Zaragoza city station IDs (from resource 325)
const ZARAGOZA_STATION_IDS = new Set([
  50297026, 50297029, 50297032,
  50297036, 50297037, 50297038,
  50297039, 50297040
]);

let cacheData = [];

async function fetchSensores() {
  console.log('[SensoresIOT] Fetching stations + measurements from Aragón Open Data');
  try {
    const [stationsResp, measurementsResp] = await Promise.all([
      axios.get(STATIONS_URL,     { timeout: 15000 }),
      axios.get(MEASUREMENTS_URL, { timeout: 30000 })
    ]);

    // Build station maps
    const stationNames = {};
    const stationCoords = {};
    for (const f of (stationsResp.data?.features || [])) {
      const id = f.properties?.id;
      stationNames[id] = f.properties?.name;
      if (f.geometry && f.geometry.coordinates) {
        stationCoords[id] = {
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1]
        };
      }
    }

    // Keep only Zaragoza city stations and get latest reading per station + magnitude
    const latest = {}; // key: `${id}_${magnitud}`
    for (const r of (measurementsResp.data || [])) {
      if (!ZARAGOZA_STATION_IDS.has(r.id)) continue;
      const key = `${r.id}_${r.magnitud}`;
      if (!latest[key] || r.fechahora > latest[key].fechahora) {
        latest[key] = r;
      }
    }

    // Group by station
    const byStation = {};
    for (const id of Array.from(ZARAGOZA_STATION_IDS)) {
      byStation[id] = {
        station_id: id,
        station_name: stationNames[id] || `Estación ${id}`,
        lat: stationCoords[id]?.lat,
        lng: stationCoords[id]?.lng,
        timestamp: null,
        NO2: null, O3: null, PM10: null, 'PM2.5': null, SO2: null
      };
    }

    for (const r of Object.values(latest)) {
      if (!byStation[r.id]) continue; // sanity check
      const val = parseFloat(r.valor_medido);
      byStation[r.id][r.magnitud] = isNaN(val) ? "--" : val;
      // Keep latest timestamp
      if (!byStation[r.id].timestamp || r.fechahora > byStation[r.id].timestamp) {
        byStation[r.id].timestamp = r.fechahora;
      }
    }

    const result = Object.values(byStation);
    console.log(`[SensoresIOT] Got ${result.length} stations data.`);
    cacheData = result;
    return result;

  } catch (error) {
    console.error('[SensoresIOT] Error:', error.message);
    return cacheData;
  }
}

function getSensores() {
  return cacheData;
}

module.exports = {
  fetchSensores,
  getSensores
};
