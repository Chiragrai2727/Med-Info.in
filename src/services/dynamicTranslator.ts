import { Language } from "../types";

// Setup queue
interface QueuedItem {
  key: string;
  englishText: string;
}

let pendingTranslations: Record<Language, QueuedItem[]> = {} as any;
let translateTimer: ReturnType<typeof setTimeout> | null = null;
let dynamicTranslationsCache: Record<Language, Record<string, string>> = {} as any;

try {
  const cached = localStorage.getItem('dynamic_med_translations');
  if (cached) {
    dynamicTranslationsCache = JSON.parse(cached);
  }
} catch (e) {
  console.error("Local storage read fail", e);
}

type OnTranslationCallback = () => void;
const subscribers: OnTranslationCallback[] = [];

export function subscribeToTranslations(cb: OnTranslationCallback) {
  subscribers.push(cb);
  return () => {
    const idx = subscribers.indexOf(cb);
    if (idx !== -1) subscribers.splice(idx, 1);
  };
}

function notifySubscribers() {
  subscribers.forEach(cb => cb());
}

// Custom Key-less Translation Agent (utilizing public GTX endpoints from scratch)
async function fetchFreeTranslation(text: string, toLang: string): Promise<string> {
  try {
    // Map specialized Indian language codes that might need fallbacks
    const langMap: Record<string, string> = {
        'brx': 'hi', // Bodo fallback to Hindi
        'kok': 'mr', // Konkani fallback to Marathi
        'as': 'as',
        'or': 'or',
        'sa': 'sa', // Sanskrit
    };
    const targetLang = langMap[toLang] || toLang;

    // Use free public GTX endpoint for progressive offline/keyless translations
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
    
    if (!response.ok) return text;
    
    const data = await response.json();
    let translatedText = "";
    if (data && data[0]) {
        data[0].forEach((item: any) => {
            if (item[0]) translatedText += item[0];
        });
    }
    return translatedText || text;
  } catch (error) {
    console.warn("Free translate payload failed, gracefully retaining english.", error);
    return text;
  }
}

async function flushTranslations(lang: Language) {
  const items = pendingTranslations[lang];
  if (!items || items.length === 0) return;
  
  // Clone and clear queue partition
  pendingTranslations[lang] = [];
  
  // Dedup items locally
  const uniqueItemsMap = new Map<string, string>();
  for (const item of items) {
    if (!dynamicTranslationsCache[lang]?.[item.key]) {
      uniqueItemsMap.set(item.key, item.englishText);
    }
  }
  
  if (uniqueItemsMap.size === 0) return;

  const entries = Array.from(uniqueItemsMap.entries());
  console.log(`Keyless Agent: Progressively translating ${entries.length} UI strings to ${lang}...`);

  let updated = false;
  if (!dynamicTranslationsCache[lang]) {
    dynamicTranslationsCache[lang] = {};
  }

  // Micro-batching to gracefully handle rate limit heuristics on public endpoints
  const BATCH_SIZE = 3;
  
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async ([key, englishText]) => {
      // Prevent wasting requests on pure numbers or empty texts
      if (!englishText || englishText.trim().length === 0 || !isNaN(Number(englishText))) {
         dynamicTranslationsCache[lang][key] = englishText;
         return;
      }

      const translated = await fetchFreeTranslation(englishText, lang);
      if (translated && translated !== englishText) {
         dynamicTranslationsCache[lang][key] = translated;
         updated = true;
      }
    }));

    if (i + BATCH_SIZE < entries.length) {
        await new Promise(res => setTimeout(res, 600)); // Natural rate pacing buffer
    }
  }
  
  if (updated) {
    // Persist progressively generated corpus map
    localStorage.setItem('dynamic_med_translations', JSON.stringify(dynamicTranslationsCache));
    notifySubscribers();
  }
}

export function queueTranslation(key: string, englishText: string, lang: Language) {
  if (lang === 'en') return;
  if (!navigator.onLine) return;
  
  if (!dynamicTranslationsCache[lang]) dynamicTranslationsCache[lang] = {};
  if (dynamicTranslationsCache[lang][key]) return;
  
  if (!pendingTranslations[lang]) pendingTranslations[lang] = [];
  
  // Throttle duplicates dynamically at queue-insertion
  if (pendingTranslations[lang].some(x => x.key === key)) return;
  
  pendingTranslations[lang].push({ key, englishText });
  
  if (translateTimer) clearTimeout(translateTimer);
  translateTimer = setTimeout(() => {
    Object.keys(pendingTranslations).forEach(l => flushTranslations(l as Language));
  }, 1000); // 1-second progressive dispatch debounce
}

export function getDynamicTranslation(key: string, lang: Language): string | null {
  if (lang === 'en') return null;
  return dynamicTranslationsCache[lang]?.[key] || null;
}
