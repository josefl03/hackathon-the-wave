import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

export function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

export async function writeJson(dir, prefix, payload) {
  await ensureDir(dir);
  const filePath = path.join(dir, `${prefix}-${timestampForFile()}.json`);
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return filePath;
}

export async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json,text/plain;q=0.9,*/*;q=0.8',
      'user-agent': 'valencia-fire-iot/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
