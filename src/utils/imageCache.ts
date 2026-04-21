export async function computeImageHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(Date.now().toString()); // fallback hash
      }
      
      ctx.drawImage(img, 0, 0, 16, 16);
      const imageData = ctx.getImageData(0, 0, 16, 16);
      const data = imageData.data;
      
      let totalBrightness = 0;
      const grays = [];
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const gray = (r * 0.299 + g * 0.587 + b * 0.114);
        grays.push(gray);
        totalBrightness += gray;
      }
      
      const avgBrightness = totalBrightness / grays.length;
      let binaryString = '';
      
      for (let i = 0; i < grays.length; i++) {
        binaryString += grays[i] > avgBrightness ? '1' : '0';
      }
      
      // Convert 256 bits to hex string (chunks of 8 bits)
      let hexString = '';
      for (let i = 0; i < binaryString.length; i += 8) {
        const byte = binaryString.substring(i, i + 8);
        hexString += parseInt(byte, 2).toString(16).padStart(2, '0');
      }
      
      resolve(hexString);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(Date.now().toString()); // fallback
    };
    
    img.src = url;
  });
}

const CACHE_KEY = 'aeth_cache_v1';

interface CacheEntry {
  hash: string;
  result: string;
  timestamp: number;
}

export function getCachedResult(hash: string): string | null {
  try {
    const store = localStorage.getItem(CACHE_KEY);
    if (!store) return null;
    const entries: CacheEntry[] = JSON.parse(store);
    const entry = entries.find(e => e.hash === hash);
    if (entry) {
      updateStats(true);
      return entry.result;
    }
  } catch (e) {
    console.warn("Error reading cache", e);
  }
  updateStats(false);
  return null;
}

export function setCachedResult(hash: string, result: string): void {
  try {
    const store = localStorage.getItem(CACHE_KEY);
    let entries: CacheEntry[] = store ? JSON.parse(store) : [];
    
    entries = entries.filter(e => e.hash !== hash); // Remove if exists
    entries.push({ hash, result, timestamp: Date.now() });
    
    // Enforce max 50 entries
    if (entries.length > 50) {
      // Sort ascending by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);
      // Remove oldest
      entries.shift();
    }
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.warn("Error writing cache", e);
  }
}

const STATS_KEY = 'aeth_cache_stats';

function updateStats(hit: boolean) {
  try {
    const store = localStorage.getItem(STATS_KEY);
    const stats = store ? JSON.parse(store) : { hits: 0, misses: 0 };
    if (hit) stats.hits++;
    else stats.misses++;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export function getCacheStats(): { hits: number, misses: number, size: number } {
  try {
    const statsStr = localStorage.getItem(STATS_KEY);
    const entriesStr = localStorage.getItem(CACHE_KEY);
    
    const stats = statsStr ? JSON.parse(statsStr) : { hits: 0, misses: 0 };
    const entries: CacheEntry[] = entriesStr ? JSON.parse(entriesStr) : [];
    
    return { ...stats, size: entries.length };
  } catch {
    return { hits: 0, misses: 0, size: 0 };
  }
}
