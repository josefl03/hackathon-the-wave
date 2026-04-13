/**
 * Fetcher: Portal Datos Abiertos Zaragoza
 * URL: https://www.zaragoza.es/sede/portal/datos-abiertos/api
 */

import axios from 'axios';
import { normalizeResponse, normalizeError } from '../utils/normalize.js';
import Cache from '../utils/cache.js';

const PORTAL_URL = 'https://www.zaragoza.es/sede/portal/datos-abiertos/api';
const cache = new Cache(2 * 60 * 60 * 1000); // 2 hour cache
const CACHE_KEY = 'portal_zaragoza';

async function fetchPortalZaragoza() {
  try {
    // Check cache
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      console.error('[Portal] Cache hit');
      return normalizeResponse('portal_zaragoza', cached, 'ok');
    }

    console.error('[Portal] Fetching from', PORTAL_URL);
    
    const response = await axios.get(PORTAL_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    // Parse portal response - structure varies, normalize what we get
    const data = response.data;
    
    const portalData = {
      datasets: data.datasets?.length || 0,
      resources: data.resources?.length || 0,
      organizations: (data.organizations || []).map(org => ({
        name: org.name,
        title: org.title,
        package_count: org.package_count
      })),
      raw_response: data
    };

    console.error(`[Portal] Got ${portalData.datasets} datasets`);
    
    // Cache result
    cache.set(CACHE_KEY, portalData);
    
    return normalizeResponse('portal_zaragoza', portalData, 'ok');
  } catch (error) {
    console.error('[Portal] Error:', error.message);
    
    // Fallback: return metadata about expected datasets
    const fallback = {
      datasets: 0,
      resources: 0,
      organizations: [],
      message: 'Portal temporarily unavailable',
      note: 'Check https://www.zaragoza.es/sede/portal/datos-abiertos/api for updates'
    };
    
    return normalizeResponse('portal_zaragoza', fallback, 'partial', error.message);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await fetchPortalZaragoza();
  console.log(JSON.stringify(result, null, 2));
}

export default fetchPortalZaragoza;
