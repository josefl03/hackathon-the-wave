# Zaragoza APIs - Data Extraction Module

Módulo de extracción de datos para 5 APIs/sources de Zaragoza. Cada source tiene un extractor independiente que normaliza los datos a JSON estándar.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run all sources in parallel
npm run fetch-all

# Run individual sources
npm run fetch-sensores
npm run fetch-calidad-aire
npm run fetch-alertas
npm run fetch-portal
npm run fetch-camaras
```

---

## 📊 Data Sources

### 1. **Sensores - Islas de Calor** 
- **File:** `scripts/fetch-sensores.js`
- **Source:** `https://www.zaragoza.es/contenidos/medioambiente/islascalor/sensores_islas.geojson`
- **Type:** GeoJSON REST endpoint
- **Cache:** 1 hour
- **Output:**
  ```json
  {
    "source": "sensores_islas",
    "timestamp": "2024-04-13T10:30:00Z",
    "status": "ok",
    "data": [
      {
        "sensor_id": "...",
        "name": "...",
        "lat": 41.65,
        "lon": -0.88,
        "temperature": 25.5,
        "humidity": 45,
        "timestamp": "..."
      }
    ]
  }
  ```

### 2. **Calidad del Aire - Aragón**
- **File:** `scripts/fetch-calidad-aire.js`
- **Source:** `https://opendata.aragon.es/api/3/action/datastore_search`
- **Type:** API REST (CKAN)
- **Cache:** 5 minutes
- **Parameters:** PM2.5, PM10, NO2, O3, SO2, AQI
- **Output:**
  ```json
  {
    "source": "calidad_aire_aragon",
    "timestamp": "2024-04-13T10:30:00Z",
    "status": "ok",
    "data": [
      {
        "province": "Zaragoza",
        "pm25": 25,
        "pm10": 45,
        "no2": 35,
        "o3": 60,
        "so2": 8,
        "aqi": "Moderado",
        "timestamp": "..."
      }
    ]
  }
  ```

### 3. **Niveles de Alerta - Incendios Forestales**
- **File:** `scripts/fetch-alertas.js`
- **Source:** `https://www.aragon.es/prevencion-y-extincion-de-incendios-forestales/niveles-de-alerta`
- **Type:** Web scraper (Puppeteer)
- **Cache:** 10 minutes
- **Output:**
  ```json
  {
    "source": "alertas_incendios",
    "timestamp": "2024-04-13T10:30:00Z",
    "status": "ok",
    "data": {
      "low": 3,
      "moderate": 5,
      "high": 2,
      "extreme": 0,
      "total_zones": 10,
      "source": "aragon.es"
    }
  }
  ```

### 4. **Portal Datos Abiertos Zaragoza**
- **File:** `scripts/fetch-portal-zaragoza.js`
- **Source:** `https://www.zaragoza.es/sede/portal/datos-abiertos/api`
- **Type:** API REST
- **Cache:** 2 hours
- **Output:**
  ```json
  {
    "source": "portal_zaragoza",
    "timestamp": "2024-04-13T10:30:00Z",
    "status": "ok",
    "data": {
      "datasets": 150,
      "resources": 500,
      "organizations": [...]
    }
  }
  ```

### 5. **Cámaras de Vigilancia**
- **File:** `scripts/fetch-camaras.js`
- **Source:** `https://es.worldcam.eu/webcams/...`
- **Type:** Web scraper (Cheerio)
- **Cache:** 30 minutes
- **Output:**
  ```json
  {
    "source": "camaras_zaragoza",
    "timestamp": "2024-04-13T10:30:00Z",
    "status": "ok",
    "data": [
      {
        "id": "fiscal-camping-el-jabali",
        "name": "Fiscal Camping El Jabalí Blanco",
        "url": "https://es.worldcam.eu/...",
        "stream_url": "https://...",
        "available": true,
        "tags": ["vigilancia", "naturaleza"]
      }
    ]
  }
  ```

---

## 📁 Project Structure

```
zaragoza/
├── package.json                   # Dependencies
├── README.md                      # This file
├── scripts/
│   ├── fetch-sensores.js         # GeoJSON sensors
│   ├── fetch-calidad-aire.js     # Air quality API
│   ├── fetch-alertas.js          # Fire alerts scraper
│   ├── fetch-portal-zaragoza.js  # Portal API
│   ├── fetch-camaras.js          # Cameras scraper
│   └── fetch-all.js              # Orchestrator (parallel)
├── utils/
│   ├── normalize.js              # Data transformation
│   └── cache.js                  # TTL-based cache
└── data/
    └── .cache/                   # Local cache storage (gitignored)
```

---

## 🔧 Usage in Other Scripts

### As a Node Module

```javascript
// From another script in your project
import fetchAllZaragoza from './zaragoza/scripts/fetch-all.js';

const data = await fetchAllZaragoza();
console.log(data.sources.sensores_islas.data); // Array of sensors
```

### Individual Fetchers

```javascript
import fetchSensores from './zaragoza/scripts/fetch-sensores.js';
import fetchAirQuality from './zaragoza/scripts/fetch-calidad-aire.js';

const sensors = await fetchSensores();
const air = await fetchAirQuality();

if (sensors.status === 'ok') {
  sensors.data.forEach(sensor => {
    console.log(`${sensor.name}: ${sensor.temperature}°C`);
  });
}
```

---

## ⚡ Performance

| Source | Method | Cache TTL | Typical Time |
|--------|--------|-----------|--------------|
| Sensores | GET | 1h | 200ms |
| Calidad Aire | API | 5m | 500ms |
| Alertas | Scrape | 10m | 3-5s |
| Portal | API | 2h | 300ms |
| Cámaras | Scrape | 30m | 2-3s |
| **Fetch All** | Parallel | Mixed | **~5s** |

---

## 🛠️ Configuration

### Cache TTL (Time To Live)

Modify in each script:

```javascript
const cache = new Cache(60 * 60 * 1000); // 1 hour in milliseconds
```

Common values:
- `5 * 60 * 1000` = 5 minutes
- `10 * 60 * 1000` = 10 minutes
- `60 * 60 * 1000` = 1 hour

### Disable Cache

```javascript
const cached = null; // Skip cache check
// Or clear programmatically:
cache.clear();
```

---

## 📦 Dependencies

```json
{
  "axios": "^1.6.0",       // HTTP client
  "cheerio": "^1.0.0-rc.12", // HTML parsing
  "puppeteer": "^21.0.0"    // Headless browser
}
```

---

## 🚨 Error Handling

Each fetcher returns a normalized response:

```javascript
{
  "source": "sensores_islas",
  "timestamp": "2024-04-13T10:30:00Z",
  "status": "ok" | "error" | "partial",
  "data": {...},
  "error_msg": null | "Error description"
}
```

**Status codes:**
- `ok` - All data successfully retrieved
- `partial` - Some data retrieved, some failed
- `error` - Complete failure

---

## 🔄 Caching Strategy

- **Memory cache** + **File persistence**
- Automatic cache expiration after TTL
- Cache stored in `data/.cache/` (gitignored)
- Check `cache.status()` for debugging

```javascript
import Cache from './utils/cache.js';
const cache = new Cache();
console.log(cache.status());
// { memory_entries: 3, ttl_ms: 3600000, file_count: 5 }
```

---

## 📊 Output Example (fetch-all)

```json
{
  "timestamp": "2024-04-13T10:30:45.123Z",
  "duration_ms": 4832,
  "sources": {
    "sensores_islas": { "source": "...", "status": "ok", "data": [...] },
    "calidad_aire": { "source": "...", "status": "ok", "data": [...] },
    "alertas_incendios": { "source": "...", "status": "ok", "data": {...} },
    "portal": { "source": "...", "status": "partial", "data": {...} },
    "camaras": { "source": "...", "status": "ok", "data": [...] }
  },
  "status": "ok",
  "errors": []
}
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Puppeteer hangs | Increase timeout, check system memory |
| Cache not working | Check `data/.cache/` permissions |
| API returns 403 | Update User-Agent in headers |
| Empty results | Check source URL availability |

---

## 📝 License

MIT - Part of Hackathon The Wave

---

## 🤝 Contributing

To add a new data source:

1. Create `scripts/fetch-YOUR-SOURCE.js`
2. Import and use normalization utilities
3. Add to `fetch-all.js` parallel array
4. Update this README with documentation
5. Commit to repository

---

**Last Updated:** 2024-04-13  
**Status:** ✅ Production Ready
