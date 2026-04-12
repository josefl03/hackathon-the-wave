import path from 'node:path';
import { fetchJson, writeJson } from './lib.js';

const SOURCE = 'rvvcca-ica';
const OUT_DIR = path.resolve('data', 'rvvcca');
const URL = 'https://terramapas.icv.gva.es/0503_CalidadAire?service=WFS&version=2.0.0&request=GetFeature&typename=ms%3ARVVCCA.ICA&outputformat=application%2Fjson%3B%20subtype%3Dgeojson';

const wantedFields = [
  'stationid',
  'stationcode',
  'stationname',
  'timeinstant',
  'stvalue',
  'stqualityid',
  'stqualitynamees',
  'stqualitycolor',
  'so2value',
  'no2value',
  'pm25value',
  'pm10value',
  'o3value',
  'url_cas',
  'url_val'
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
