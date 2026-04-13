/**
 * Normalize disparate data sources into a common schema
 * Schema: { source, timestamp, data, status, error_msg }
 */

export function normalizeResponse(source, data, status = 'ok', error_msg = null) {
  return {
    source,
    timestamp: new Date().toISOString(),
    data,
    status,
    error_msg
  };
}

export function normalizeError(source, error) {
  return normalizeResponse(
    source,
    null,
    'error',
    error?.message || String(error)
  );
}

/**
 * Transform GeoJSON sensores into flat array
 */
export function parseGeoJSONSensores(geojson) {
  if (!geojson?.features) return [];
  
  // Zaragoza islas de calor GeoJSON uses COD_OBS / NOMBRE / POINT_X / POINT_Y
  // Coordinates are in EPSG:25830 (UTM zone 30N) — stored as utm_x/utm_y
  return geojson.features.map(feature => ({
    sensor_id: feature.properties?.COD_OBS,
    name: feature.properties?.NOMBRE,
    utm_x: feature.properties?.POINT_X,
    utm_y: feature.properties?.POINT_Y,
    coordinates_raw: feature.geometry?.coordinates,
    // No live temp/humidity in this static GeoJSON — populated by separate API if available
    temperature: feature.properties?.temperature ?? null,
    humidity: feature.properties?.humidity ?? null,
    timestamp: feature.properties?.timestamp ?? null
  })).filter(s => s.sensor_id != null);
}

/**
 * Transform air quality array into indexed object
 */
export function parseAirQuality(arr) {
  if (!Array.isArray(arr)) return {};
  
  return arr.reduce((acc, item) => {
    const province = item.province || 'unknown';
    acc[province] = {
      pm25: item.pm25,
      pm10: item.pm10,
      no2: item.no2,
      o3: item.o3,
      so2: item.so2,
      timestamp: item.timestamp
    };
    return acc;
  }, {});
}

/**
 * Parse fire alert levels from HTML DOM
 */
export function parseAlertLevels(levels) {
  // levels = { 0, 1, 2, 3, count }
  return {
    low: levels[0] || 0,
    moderate: levels[1] || 0,
    high: levels[2] || 0,
    extreme: levels[3] || 0,
    total_zones: levels.count || 0,
    timestamp: new Date().toISOString()
  };
}

/**
 * Extract camera streams from HTML
 */
export function parseCameras(arr) {
  if (!Array.isArray(arr)) return [];
  
  return arr.map(cam => ({
    id: cam.id,
    name: cam.name,
    url: cam.url,
    stream_url: cam.stream_url,
    type: cam.type || 'webcam',
    location: cam.location,
    tags: cam.tags || []
  }));
}

export default {
  normalizeResponse,
  normalizeError,
  parseGeoJSONSensores,
  parseAirQuality,
  parseAlertLevels,
  parseCameras
};
