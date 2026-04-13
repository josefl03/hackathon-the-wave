/**
 * Orquestador: Fetch all Zaragoza data sources in parallel
 * Combines: sensores, calidad-aire, alertas, portal, camaras
 */

import fetchSensores from './fetch-sensores.js';
import fetchAirQuality from './fetch-calidad-aire.js';
import fetchAlertasIncendios from './fetch-alertas.js';
import fetchPortalZaragoza from './fetch-portal-zaragoza.js';
import fetchCameras from './fetch-camaras.js';

async function fetchAllZaragoza() {
  console.log('=== Starting parallel fetch of all Zaragoza data ===\n');
  
  const startTime = Date.now();
  
  try {
    // Run all 5 fetchers in parallel
    const results = await Promise.allSettled([
      fetchSensores(),
      fetchAirQuality(),
      fetchAlertasIncendios(),
      fetchPortalZaragoza(),
      fetchCameras()
    ]);

    // Consolidate results
    const consolidated = {
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      sources: {
        sensores_islas: null,
        calidad_aire: null,
        alertas_incendios: null,
        portal: null,
        camaras: null
      },
      status: 'ok',
      errors: []
    };

    // Parse results
    const resultNames = ['sensores_islas', 'calidad_aire', 'alertas_incendios', 'portal', 'camaras'];
    results.forEach((result, idx) => {
      const name = resultNames[idx];
      
      if (result.status === 'fulfilled') {
        consolidated.sources[name] = result.value;
        
        if (result.value.status === 'error') {
          consolidated.errors.push({
            source: name,
            error: result.value.error_msg
          });
        }
      } else {
        consolidated.status = 'partial';
        consolidated.errors.push({
          source: name,
          error: result.reason?.message || String(result.reason)
        });
      }
    });

    // Summary
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`\n✓ Completed ${successCount}/5 sources in ${consolidated.duration_ms}ms`);
    
    if (consolidated.errors.length > 0) {
      console.log('\n⚠ Errors:');
      consolidated.errors.forEach(err => {
        console.log(`  - ${err.source}: ${err.error}`);
      });
    }

    return consolidated;
  } catch (error) {
    console.error('Fatal error:', error.message);
    return {
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      status: 'error',
      error: error.message
    };
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await fetchAllZaragoza();
  console.log('\n' + JSON.stringify(result, null, 2));
}

export default fetchAllZaragoza;
