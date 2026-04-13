/**
 * Fetcher: Niveles de Alerta - Incendios Forestales Aragón
 * URL: https://www.aragon.es/prevencion-y-extincion-de-incendios-forestales/niveles-de-alerta
 */

import puppeteer from 'puppeteer';
import { normalizeResponse, normalizeError } from '../utils/normalize.js';
import Cache from '../utils/cache.js';

const ALERTS_URL = 'https://www.aragon.es/prevencion-y-extincion-de-incendios-forestales/niveles-de-alerta';
const cache = new Cache(10 * 60 * 1000); // 10 min cache (fire alerts more volatile)
const CACHE_KEY = 'alertas_incendios';

async function fetchAlertsWithPuppeteer() {
  let browser;
  try {
    console.error('[Alerts] Launching browser');
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(ALERTS_URL, { waitUntil: 'networkidle2', timeout: 15000 });

    // Extract alert levels from page
    const alerts = await page.evaluate(() => {
      // Look for alert level indicators
      const levels = {
        0: 0, // Bajo
        1: 0, // Moderado
        2: 0, // Alto
        3: 0, // Extremo
        count: 0
      };

      // Try different selectors depending on page structure
      const levelElements = document.querySelectorAll('[class*="nivel"], [class*="alert"], [data-level]');
      
      levelElements.forEach((el) => {
        const classList = el.className.toLowerCase();
        const dataLevel = el.dataset.level;
        
        if (classList.includes('nivel-0') || dataLevel === '0') levels[0]++;
        else if (classList.includes('nivel-1') || dataLevel === '1') levels[1]++;
        else if (classList.includes('nivel-2') || dataLevel === '2') levels[2]++;
        else if (classList.includes('nivel-3') || dataLevel === '3') levels[3]++;
      });

      // Alternative: look for text content
      const pageText = document.body.innerText.toLowerCase();
      
      return {
        levels,
        page_text_length: pageText.length,
        timestamp: new Date().toISOString()
      };
    });

    await browser.close();

    return {
      low: alerts.levels[0],
      moderate: alerts.levels[1],
      high: alerts.levels[2],
      extreme: alerts.levels[3],
      total_zones: alerts.levels.count,
      timestamp: alerts.timestamp,
      source: 'aragon.es'
    };
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

async function fetchAlertasIncendios() {
  try {
    // Check cache first
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      console.error('[Alerts] Cache hit');
      return normalizeResponse('alertas_incendios', cached, 'ok');
    }

    console.error('[Alerts] Fetching from', ALERTS_URL);
    
    const alertData = await fetchAlertsWithPuppeteer();
    
    console.error('[Alerts] Levels:', alertData);
    
    // Cache result
    cache.set(CACHE_KEY, alertData);
    
    return normalizeResponse('alertas_incendios', alertData, 'ok');
  } catch (error) {
    console.error('[Alerts] Error:', error.message);
    
    // Fallback: return structure without real data
    const fallback = {
      low: 0,
      moderate: 0,
      high: 0,
      extreme: 0,
      total_zones: 0,
      timestamp: new Date().toISOString(),
      source: 'fallback',
      note: 'Check website directly for current fire alert levels'
    };
    
    return normalizeResponse('alertas_incendios', fallback, 'partial', error.message);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await fetchAlertasIncendios();
  console.log(JSON.stringify(result, null, 2));
}

export default fetchAlertasIncendios;
