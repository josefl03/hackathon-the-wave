import path from 'node:path';
import { fetchJson, writeJson } from './lib.js';

const SOURCE = 'avamet-estaciones';
const OUT_DIR = path.resolve('data', 'avamet');
const URL = 'https://terramapas.icv.gva.es/0508_AVAMET?service=WFS&version=1.1.0&request=GetFeature&typeName=AVAMET.Estaciones&outputFormat=application%2Fjson%3B%20subtype%3Dgeojson';

const wantedFields = [
  'id',
  'nom',
  'temp',
  'hrel',
  'pres',
  'prec',
  'vent_vel',
  'vent_dir',
  'vent_dir_360',
  'vent_max',
  'webcam',
  'urlmxo',
  'actualitzacio'
];

function normalizeFeature(feature) {
  const properties = feature?.properties ?? {};
  const selected = Object.fromEntries(wantedFields.map((field) => [field, properties[field] ?? null]));

  return {
    ...selected,
    geometry: feature?.geometry ?? null
  };
}

export async function run() {
  const raw = await fetchJson(URL);
  const features = Array.isArray(raw?.features) ? raw.features : [];

  const normalized = {
    source: SOURCE,
    fetchedAt: new Date().toISOString(),
    url: URL,
    count: features.length,
    stations: features.map(normalizeFeature)
  };

  const filePath = await writeJson(OUT_DIR, SOURCE, normalized);
  console.log(JSON.stringify({ source: SOURCE, filePath, count: features.length }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
