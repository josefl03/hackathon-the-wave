/**
 * Fetcher: Cámaras Zaragoza
 * URL: https://es.worldcam.eu/webcams/europe/spain/...
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeResponse, normalizeError } from '../utils/normalize.js';
import Cache from '../utils/cache.js';

const CAMERAS = [
  {
    id: 'fiscal-camping-el-jabali',
    url: 'https://es.worldcam.eu/webcams/europe/spain/32948-fiscal-camping-el-jabali-blanco',
    name: 'Fiscal Camping El Jabalí Blanco',
    location: 'Jabalí (Zaragoza)',
    tags: ['vigilancia', 'naturaleza', 'camping']
  }
];

const cache = new Cache(30 * 60 * 1000); // 30 min cache
const CACHE_KEY = 'camaras_zaragoza';

async function extractStreamUrl(cameraUrl) {
  try {
    const response = await axios.get(cameraUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Look for video/stream elements
    const videoSrc = $('video source').attr('src') || 
                     $('iframe').attr('src') ||
                     $('[data-stream]').attr('data-stream') ||
                     null;

    return videoSrc || null;
  } catch (error) {
    console.warn(`[Cameras] Failed to extract stream from ${cameraUrl}:`, error.message);
    return null;
  }
}

async function fetchCameras() {
  try {
    // Check cache
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      console.error('[Cameras] Cache hit');
      return normalizeResponse('camaras_zaragoza', cached, 'ok');
    }

    console.error('[Cameras] Fetching camera streams');
    
    const camerasWithStreams = await Promise.all(
      CAMERAS.map(async (cam) => {
        console.error(`  → Extracting ${cam.id}`);
        const stream_url = await extractStreamUrl(cam.url);
        
        return {
          ...cam,
          stream_url: stream_url || cam.url,
          available: stream_url !== null
        };
      })
    );

    const available = camerasWithStreams.filter(c => c.available);
    console.error(`[Cameras] Got ${available.length}/${camerasWithStreams.length} active cameras`);
    
    // Cache result
    cache.set(CACHE_KEY, camerasWithStreams);
    
    return normalizeResponse('camaras_zaragoza', camerasWithStreams, 'ok');
  } catch (error) {
    console.error('[Cameras] Error:', error.message);
    
    // Return known cameras even if stream extraction failed
    const fallback = CAMERAS.map(cam => ({
      ...cam,
      stream_url: cam.url,
      available: false
    }));
    
    return normalizeResponse('camaras_zaragoza', fallback, 'partial', 'Stream extraction failed, using fallback');
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await fetchCameras();
  console.log(JSON.stringify(result, null, 2));
}

export default fetchCameras;
