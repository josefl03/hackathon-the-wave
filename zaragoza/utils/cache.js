/**
 * Simple in-memory cache with TTL and file persistence
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '../data/.cache');

class Cache {
  constructor(ttl = 3600000) { // 1 hour default
    this.ttl = ttl;
    this.memory = new Map();
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  }

  key(prefix) {
    return `${prefix}_${Date.now()}`;
  }

  set(key, value) {
    const expires = Date.now() + this.ttl;
    const entry = { value, expires };
    
    // Memory cache
    this.memory.set(key, entry);
    
    // File persistence
    try {
      const filepath = path.join(CACHE_DIR, `${key}.json`);
      fs.writeFileSync(filepath, JSON.stringify(entry), 'utf8');
    } catch (e) {
      console.warn(`[Cache] Failed to persist ${key}:`, e.message);
    }
  }

  get(key) {
    // Check memory first
    if (this.memory.has(key)) {
      const entry = this.memory.get(key);
      if (entry.expires > Date.now()) {
        return entry.value;
      }
      this.memory.delete(key);
    }

    // Check file
    try {
      const filepath = path.join(CACHE_DIR, `${key}.json`);
      if (fs.existsSync(filepath)) {
        const entry = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        if (entry.expires > Date.now()) {
          this.memory.set(key, entry); // Restore to memory
          return entry.value;
        }
        fs.unlinkSync(filepath); // Remove expired
      }
    } catch (e) {
      console.warn(`[Cache] Failed to read ${key}:`, e.message);
    }

    return null;
  }

  clear() {
    this.memory.clear();
    try {
      const files = fs.readdirSync(CACHE_DIR);
      files.forEach(f => fs.unlinkSync(path.join(CACHE_DIR, f)));
    } catch (e) {
      console.warn('[Cache] Failed to clear directory:', e.message);
    }
  }

  status() {
    return {
      memory_entries: this.memory.size,
      ttl_ms: this.ttl,
      cache_dir: CACHE_DIR,
      file_count: fs.existsSync(CACHE_DIR) ? fs.readdirSync(CACHE_DIR).length : 0
    };
  }
}

export default Cache;
