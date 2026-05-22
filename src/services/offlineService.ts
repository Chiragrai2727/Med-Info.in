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
  // Clear all cached data
  clearCache: () => {
    try {
      localStorage.removeItem(MEDICINE_CACHE_KEY);
      localStorage.removeItem(SEARCH_CACHE_KEY);
      // Also clear banned drugs cache if we add it
      localStorage.removeItem('medinfo_banned_drugs_cache');
      return true;
    } catch (e) {
      return false;
    }
  },

  // Clear search history specifically
  clearHistory: () => {
    try {
      localStorage.removeItem('recentSearches_v2'); // We'll use a new versioned key for better data
      localStorage.removeItem('recentSearches'); 
      return true;
    } catch (e) {
      return false;
    }
  },

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

  // Cache banned drugs for offline access
  cacheBannedDrugs: (drugs: any[]) => {
    try {
      localStorage.setItem('medinfo_banned_drugs_cache', JSON.stringify({
        data: drugs,
        timestamp: Date.now()
      }));
    } catch (e) {}
  },

  getBannedDrugs: (): any[] | null => {
    try {
      const cached = localStorage.getItem('medinfo_banned_drugs_cache');
      return cached ? JSON.parse(cached).data : null;
    } catch (e) {
      return null;
    }
  },

  // Save search results as History
  saveToHistory: (medicine: SearchResult) => {
    try {
      const history: SearchResult[] = JSON.parse(localStorage.getItem('recentSearches_v2') || '[]');
      // Filter out existing and add to front
      const updated = [medicine, ...history.filter(h => h.name !== medicine.name)].slice(0, 20);
      localStorage.setItem('recentSearches_v2', JSON.stringify(updated));
    } catch (e) {}
  },

  getHistory: (): SearchResult[] => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches_v2') || '[]');
    } catch (e) {
      return [];
    }
  },

  // Legacy compatibility for existing search term list
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
