import { Medicine } from '../types';

const MEDICINE_CACHE_KEY = 'medinfo_medicine_cache';
const SEARCH_CACHE_KEY = 'medinfo_search_cache';
const MAX_CACHE_SIZE = 200;

interface CacheItem {
  data: Medicine;
  timestamp: number;
}

interface SearchResult {
  name: string;
  category: string;
  summary: string;
}

interface SearchCacheItem {
  results: SearchResult[];
  timestamp: number;
}

export const offlineService = {
  // Save medicine details to cache
  saveMedicine: (medicine: Medicine) => {
    try {
      const cache: Record<string, CacheItem> = JSON.parse(localStorage.getItem(MEDICINE_CACHE_KEY) || '{}');
      cache[medicine.drug_name.toLowerCase()] = {
        data: medicine,
        timestamp: Date.now()
      };
      
      // Limit cache size
      const keys = Object.keys(cache);
      if (keys.length > MAX_CACHE_SIZE) {
        delete cache[keys[0]];
      }
      
      localStorage.setItem(MEDICINE_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('Error saving to offline cache', e);
    }
  },

  // Get medicine details from cache
  getMedicine: (name: string): Medicine | null => {
    try {
      const cache: Record<string, CacheItem> = JSON.parse(localStorage.getItem(MEDICINE_CACHE_KEY) || '{}');
      const q = name.toLowerCase();
      
      // 1. Direct match
      if (cache[q]) return cache[q].data;
      
      // 2. Search by brand names
      const found = Object.values(cache).find((item: CacheItem) => 
        item.data.drug_name.toLowerCase() === q || 
        item.data.brand_names_india.some((b: string) => b.toLowerCase() === q)
      );
      
      return found ? found.data : null;
    } catch (e) {
      return null;
    }
  },

  // Save search results to cache
  saveSearchResults: (query: string, results: SearchResult[]) => {
    try {
      const cache: Record<string, SearchCacheItem> = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || '{}');
      cache[query.toLowerCase()] = {
        results,
        timestamp: Date.now()
      };
      localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {}
  },

  // Get search results from cache
  getSearchResults: (query: string): SearchResult[] | null => {
    try {
      const cache: Record<string, SearchCacheItem> = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || '{}');
      return cache[query.toLowerCase()]?.results || null;
    } catch (e) {
      return null;
    }
  },

  // Search within cached medicines (for offline mode)
  searchOffline: (query: string): SearchResult[] => {
    try {
      const cache: Record<string, CacheItem> = JSON.parse(localStorage.getItem(MEDICINE_CACHE_KEY) || '{}');
      const results = Object.values(cache)
        .map((item: CacheItem) => item.data)
        .filter((med: Medicine) => 
          med.drug_name.toLowerCase().includes(query.toLowerCase()) || 
          med.brand_names_india.some(b => b.toLowerCase().includes(query.toLowerCase()))
        )
        .map((med: Medicine) => ({
          name: med.drug_name,
          category: med.category,
          summary: med.quick_summary || (Array.isArray(med.uses) ? med.uses.join(', ') : (med.uses as unknown as string)).substring(0, 100) + '...'
        }));
      return results.slice(0, 5);
    } catch (e) {
      return [];
    }
  },

  // Get all cached medicines
  getAllCached: (): Medicine[] => {
    try {
      const cache: Record<string, CacheItem> = JSON.parse(localStorage.getItem(MEDICINE_CACHE_KEY) || '{}');
      return Object.values(cache).map((item: CacheItem) => item.data);
    } catch (e) {
      return [];
    }
  }
};
