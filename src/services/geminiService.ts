import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Medicine, Language } from "../types";
import { offlineService } from "./offlineService";

// Better to have English names for AI prompts
const PROMPT_LANGUAGE_MAP: Record<Language, string> = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  gu: 'Gujarati',
  pa: 'Punjabi',
  bn: 'Bengali',
  as: 'Assamese',
  or: 'Odia',
  ur: 'Urdu',
  sa: 'Sanskrit',
  ks: 'Kashmiri',
  sd: 'Sindhi',
  kok: 'Konkani',
  doi: 'Dogri',
  mni: 'Manipuri',
  ne: 'Nepali',
  mai: 'Maithili',
  brx: 'Bodo',
  sat: 'Santali'
};
import type Fuse from 'fuse.js';

// Large datasets will be loaded lazily to improve startup performance
let localMedicines: Medicine[] = [];
let bannedMedicines: Medicine[] = [];
let allLocalMedicines: Medicine[] = [];
let searchIndex: Record<string, string[]> = {};
let categoriesIndex: Record<string, string[]> = {};
let diseasesIndex: Record<string, string[]> = {};
let fuse: Fuse<Medicine> | null = null;
let medicinesMap: Record<string, Medicine> = {};
let isDataLoaded = false;

// Optimization: Lazy load function for big JSONs
export async function ensureDataLoaded() {
  if (isDataLoaded) return;
  
  try {
    const [{ default: FuseClass }, medsData, bannedData, idxData, catsData, dissData] = await Promise.all([
      import('fuse.js'),
      import("../data/medicines.json"),
      import("../data/banned_medicines.json"),
      import("../data/index.json"),
      import("../data/categories.json"),
      import("../data/diseases.json")
    ]);

    localMedicines = medsData.default as Medicine[];
    bannedMedicines = (bannedData.default as any[]).map(m => ({ ...m, is_banned: true })) as Medicine[];
    allLocalMedicines = [...localMedicines, ...bannedMedicines];
    searchIndex = idxData.default as Record<string, string[]>;
    categoriesIndex = catsData.default as Record<string, string[]>;
    diseasesIndex = dissData.default as Record<string, string[]>;

    // Configure Fuse options
    const fuseOptions = {
        includeScore: true,
        threshold: 0.55,
        ignoreLocation: true,
        minMatchCharLength: 2,
        keys: [
          { name: 'drug_name', weight: 0.8 },
          { name: 'brand_names_india', weight: 0.6 },
          { name: 'category', weight: 0.2 },
          { name: 'uses', weight: 0.2 }
        ]
      };

    fuse = new FuseClass(allLocalMedicines, fuseOptions);
    medicinesMap = allLocalMedicines.reduce((acc, med) => {
      if (med.id) acc[String(med.id).toLowerCase()] = med;
      if (med.drug_name) acc[String(med.drug_name).toLowerCase()] = med;
      if (Array.isArray(med.brand_names_india)) {
        med.brand_names_india.forEach(brand => {
          if (brand) acc[String(brand).toLowerCase()] = med;
        });
      }
      return acc;
    }, {} as Record<string, Medicine>);

    isDataLoaded = true;
  } catch (error) {
    console.error("Failed to lazy load medical datasets:", error);
  }
}

import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';

const getAIClient = (): GoogleGenAI => {
  const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  const keys = keysStr.split(',').map(k => k.trim()).filter(Boolean);
  const apiKey = keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : "";
  return new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

export const DEFAULT_MODEL = "gemini-3-flash-preview";
export const PRO_MODEL = "gemini-3.1-pro-preview";
export const TTS_MODEL = "gemini-3.1-flash-tts-preview";

async function lazySeedToFirestore(medicine: Medicine) {
  if (!auth.currentUser) return;
  const safeId = medicine.id.toLowerCase().replace(/[^a-z0-9_-]/gi, '-').slice(0, 50);
  try {
    const medDocRef = doc(db, 'medicines', safeId);
    const docSnap = await getDoc(medDocRef);
    if (!docSnap.exists()) {
      const payload = {
        id: safeId,
        drug_name: medicine.drug_name,
        category: medicine.category || 'Unknown',
        brand_names_india: medicine.brand_names_india || [],
        quick_summary: medicine.quick_summary || '',
        uses: medicine.uses || [],
        side_effects_common: medicine.side_effects_common || [],
        dosage_common: medicine.dosage_common || '',
        pregnancy_safety: medicine.pregnancy_safety || '',
        country: 'India',
        source: 'Verified Database',
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp()
      };
      await setDoc(medDocRef, payload);
      console.log(`Lazy seeded ${medicine.drug_name} to Firestore.`);
    }
  } catch (err) {
    console.warn("Lazy seed failed:", err);
  }
}

export function getAutocompleteSuggestion(searchQuery: string): string | null {
  if (!isDataLoaded || !searchQuery || searchQuery.trim().length === 0) return null;
  const q = searchQuery.toLowerCase();
  
  const match = allLocalMedicines.find(m => {
    if (m.drug_name.toLowerCase().startsWith(q)) return true;
    if (m.brand_names_india.some(b => b.toLowerCase().startsWith(q))) return true;
    return false;
  });

  if (!match) return null;

  if (match.drug_name.toLowerCase().startsWith(q)) {
    return match.drug_name;
  }
  const brandMatch = match.brand_names_india.find(b => b.toLowerCase().startsWith(q));
  return brandMatch || match.drug_name;
}

export function isDrugBanned(name: string): boolean {
  if (!isDataLoaded) return false;
  const q = name.toLowerCase().trim();
  return bannedMedicines.some(m => 
    m.drug_name.toLowerCase() === q || 
    m.brand_names_india.some(b => b.toLowerCase() === q)
  );
}

export async function fetchMedicineDetails(searchQuery: string, lang: Language = 'en'): Promise<Medicine | null> {
  await ensureDataLoaded();
  const q = searchQuery.toLowerCase().trim();
  
  if (medicinesMap[q]) {
    const med = medicinesMap[q];
    if (lang !== 'en') {
        const cached = offlineService.getMedicine(`${med.drug_name}_${lang}`);
        if (cached) return cached;

        // If online, use AI to specifically translate this local object
        if (navigator.onLine) {
            try {
                const ai = getAIClient();
                const response = await ai.models.generateContent({
                    model: DEFAULT_MODEL,
                    contents: `Translate the following medical information for "${med.drug_name}" into ${PROMPT_LANGUAGE_MAP[lang]}. 
                    Keep the structure exactly the same.
                    Data: ${JSON.stringify(med)}`,
                    config: {
                        responseMimeType: "application/json",
                    }
                });
                const translated = JSON.parse(response.text || "{}");
                const finalMed = { ...translated, id: med.id, source: 'Verified Database' };
                offlineService.saveMedicine(finalMed, `${med.drug_name}_${lang}`);
                return finalMed;
            } catch (err) {
                console.warn("AI translation of local med failed, falling back to local English.", err);
            }
        }
    }
    
    if (auth.currentUser && med.source === 'Verified Database') {
      lazySeedToFirestore(med);
    }
    return med;
  }

  const safeId = q.replace(/[^a-z0-9_-]/gi, '-').slice(0, 50);
  try {
    const medDocRef = doc(db, 'medicines', safeId);
    const docSnap = await getDoc(medDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Medicine;
      offlineService.saveMedicine(data);
      return { ...data, source: 'Verified Database' };
    }
  } catch (firebaseErr: any) {
    console.warn("Firestore fetch error:", firebaseErr);
  }

  const cleanQuery = q.replace(/ dosage| side effects| uses| warnings| overdose/g, '').trim();
  const queryWithoutStrength = cleanQuery.replace(/\s*\d+\s*(mg|ml|g|mcg|iu|%)\s*/gi, '').trim();
  
  const localMed = allLocalMedicines.find(m => {
    const drugName = m.drug_name.toLowerCase();
    const brands = m.brand_names_india.map(b => b.toLowerCase());
    
    return drugName === q || 
           m.id.toLowerCase() === q ||
           brands.includes(q) ||
           drugName === cleanQuery ||
           brands.includes(cleanQuery) ||
           drugName === queryWithoutStrength ||
           brands.includes(queryWithoutStrength) ||
           q.includes(drugName) ||
           brands.some(b => q.includes(b));
  });
  if (localMed) return { ...localMed, source: 'Verified Database' };

  const bannedMed = bannedMedicines.find(m => 
    m.drug_name.toLowerCase().includes(q) || 
    m.brand_names_india.some(b => b.toLowerCase().includes(q))
  );
  if (bannedMed) return { ...bannedMed, source: 'Verified Database' };

  if (!navigator.onLine) {
    const cached = offlineService.getMedicine(searchQuery);
    if (cached) return { ...cached, source: 'Cached Result' };
    return null;
  }

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Generate detailed medical information for the medicine: "${searchQuery}". 
      The medicine must be a legally approved medication in India.
      Verify the information against CDSCO guidelines.
      If the medicine is a brand name, identify its generic constituents.
      The response must be in ${PROMPT_LANGUAGE_MAP[lang] || 'English'}.
      Provide accurate, non-prescriptive information for educational purposes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            category: { type: Type.STRING },
            drug_name: { type: Type.STRING },
            brand_names_india: { type: Type.ARRAY, items: { type: Type.STRING } },
            drug_class: { type: Type.STRING },
            mechanism_of_action: { type: Type.STRING },
            uses: { type: Type.ARRAY, items: { type: Type.STRING } },
            dosage_common: { type: Type.STRING },
            side_effects_common: { type: Type.ARRAY, items: { type: Type.STRING } },
            side_effects_serious: { type: Type.ARRAY, items: { type: Type.STRING } },
            overdose_effects: { type: Type.STRING },
            contraindications: { type: Type.ARRAY, items: { type: Type.STRING } },
            drug_interactions: { type: Type.ARRAY, items: { type: Type.STRING } },
            pregnancy_safety: { type: Type.STRING },
            kidney_liver_warning: { type: Type.STRING },
            how_it_works_in_body: { type: Type.STRING },
            onset_of_action: { type: Type.STRING },
            duration_of_effect: { type: Type.STRING },
            prescription_required: { type: Type.BOOLEAN },
            ayurvedic_or_allopathic: { type: Type.STRING },
            india_regulatory_status: { type: Type.STRING },
            quick_summary: { type: Type.STRING },
            who_should_take: { type: Type.STRING },
            who_should_not_take: { type: Type.STRING },
            food_interactions: { type: Type.ARRAY, items: { type: Type.STRING } },
            alcohol_warning: { type: Type.STRING },
            missed_dose: { type: Type.STRING },
          },
          required: [
            "category", "drug_name", "brand_names_india", "drug_class", "mechanism_of_action", 
            "uses", "dosage_common", "side_effects_common", "side_effects_serious", 
            "overdose_effects", "contraindications", "drug_interactions", "pregnancy_safety", 
            "kidney_liver_warning", "how_it_works_in_body", "onset_of_action", "duration_of_effect", 
            "prescription_required", "ayurvedic_or_allopathic", "india_regulatory_status", 
            "quick_summary", "who_should_take", "who_should_not_take", "food_interactions", 
            "alcohol_warning", "missed_dose"
          ]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    const medicine: Medicine = {
      ...data,
      id: safeId,
      source: 'AI Analysis'
    };

    offlineService.saveMedicine(medicine);
    
    if (auth.currentUser) {
      try {
        const medDocRef = doc(db, 'medicines', safeId);
        const payload = {
          id: safeId,
          drug_name: medicine.drug_name || searchQuery,
          category: medicine.category || 'Unknown',
          brand_names_india: medicine.brand_names_india || [],
          quick_summary: medicine.quick_summary || '',
          uses: medicine.uses || [],
          side_effects_common: medicine.side_effects_common || [],
          dosage_common: medicine.dosage_common || '',
          pregnancy_safety: medicine.pregnancy_safety || '',
          country: 'India',
          source: 'AI Analysis',
          createdBy: auth.currentUser.uid,
          createdAt: serverTimestamp()
        };
        await setDoc(medDocRef, payload);
      } catch (firebaseErr: any) {
        console.warn("Failed to write to Firebase Community DB:", firebaseErr);
      }
    }

    return medicine;
  } catch (error) {
    console.error("Error fetching medicine details:", error);
    const cached = offlineService.getMedicine(searchQuery);
    if (cached) return { ...cached, source: 'Cached Result' };
    return null;
  }
}

const searchCache: Record<string, any[]> = {};

export async function searchMedicines(searchQuery: string, lang: Language = 'en'): Promise<{ name: string; category: string; summary: string; isOffline?: boolean; source?: string; confidence?: number }[]> {
  await ensureDataLoaded();
  const q = searchQuery.toLowerCase().trim();
  const cacheKey = `${q}_${lang}`;
  
  if (searchCache[cacheKey]) {
    return searchCache[cacheKey];
  }

  const prefixSuggestions = allLocalMedicines
    .filter(m => 
      m.drug_name.toLowerCase().startsWith(q) || 
      m.brand_names_india.some(b => b.toLowerCase().startsWith(q))
    )
    .sort((a, b) => a.drug_name.length - b.drug_name.length)
    .slice(0, 8);

  if (prefixSuggestions.length > 0 && q.length >= 2) {
    const instantResults = prefixSuggestions.map(m => ({
      name: m.drug_name,
      category: m.category,
      summary: m.quick_summary || (Array.isArray(m.uses) ? m.uses.join(', ') : m.uses),
      isOffline: !navigator.onLine,
      source: 'Verified Database',
      confidence: 100
    }));
    
    if (q.length >= 3 || prefixSuggestions.some(m => m.drug_name.toLowerCase() === q)) {
      searchCache[cacheKey] = instantResults;
      return instantResults;
    }
  }

  const [backendResults, localResults] = await Promise.all([
    (async () => {
      try {
        const qLower = q.charAt(0).toUpperCase() + q.slice(1);
        const medicinesRef = collection(db, 'medicines');
        const queryConstraints = [
          where('drug_name', '>=', qLower),
          where('drug_name', '<=', qLower + '\uf8ff'),
          limit(5)
        ];
        const qBackend = query(medicinesRef, ...queryConstraints);
        const querySnapshot = await getDocs(qBackend);
        
        return querySnapshot.docs.map(doc => {
          const data = doc.data() as Medicine;
          return {
            name: data.drug_name,
            category: data.category,
            summary: data.quick_summary || (Array.isArray(data.uses) ? data.uses.join(', ') : data.uses),
            isOffline: false,
            source: 'Community DB',
            confidence: 100
          };
        });
      } catch (err) {
        console.warn("Backend search failed:", err);
        return [];
      }
    })(),
    (async () => {
      if (!fuse) return [];
      const fuseResults = fuse.search(q);
      
      const diseaseMatches = new Set(diseasesIndex[q] || []);
      const categoryMatches = new Set(categoriesIndex[q] || []);

      const scoredResults = fuseResults.map(result => {
        let score = 0;
        const baseScore = Math.max(0, (0.55 - (result.score || 0)) / 0.55) * 20000;
        score += baseScore;

        const drugNameLower = result.item.drug_name.toLowerCase();
        const brandsLower = result.item.brand_names_india.map(b => b.toLowerCase());

        if (drugNameLower === q) score += 150000;
        else if (brandsLower.includes(q)) score += 100000;
        else if (drugNameLower.startsWith(q)) score += 60000;
        else if (brandsLower.some(b => b.startsWith(q))) score += 50000;
        else if (drugNameLower.includes(` ${q}`) || drugNameLower.includes(`${q} `) ||
                 brandsLower.some(b => b.includes(` ${q}`) || b.includes(`${q} `))) {
          score += 25000;
        }

        if (diseaseMatches.has(result.item.id) || categoryMatches.has(result.item.id)) score += 40000;
        if (result.item.is_banned && score > 0) score -= 100;
        if (searchIndex[q]?.includes(result.item.id)) score += 20000;

        return { medicine: result.item, score };
      });

      const indexMatches = new Set([...diseaseMatches, ...categoryMatches, ...(searchIndex[q] || [])]);
      indexMatches.forEach(id => {
        if (!scoredResults.some(r => r.medicine.id === id)) {
          const med = medicinesMap[id];
          if (med) scoredResults.push({ medicine: med, score: 35000 });
        }
      });

      const finalScored = scoredResults.filter(item => item.score >= 500);
      const sorted = finalScored.sort((a, b) => b.score - a.score);
      const filtered = sorted.slice(0, 15);

      return filtered.map(item => {
        const confidence = Math.min(100, Math.round((item.score / 20000) * 100));
        return {
          name: item.medicine.drug_name,
          category: item.medicine.category,
          summary: item.medicine.quick_summary || (Array.isArray(item.medicine.uses) ? item.medicine.uses.join(', ') : item.medicine.uses),
          isOffline: !navigator.onLine,
          source: 'Verified Database',
          confidence
        };
      });
    })()
  ]);

  const combined = [...backendResults];
  localResults.forEach(res => {
    if (!combined.some(c => c.name.toLowerCase() === res.name.toLowerCase())) {
      combined.push(res);
    }
  });

  const final = combined.slice(0, 10);
  searchCache[cacheKey] = final;
  return final;
}

export async function getMedicinesForCondition(condition: string, lang: Language = 'en'): Promise<{ name: string; category: string; summary: string; india_regulatory_status?: string }[]> {
  await ensureDataLoaded();
  const c = condition.toLowerCase().trim();

  const medIds = diseasesIndex[c] || [];
  let results = medIds.map(id => medicinesMap[id]).filter(Boolean);

  if (results.length === 0) {
    const catMeds = categoriesIndex[c] || [];
    results = catMeds.map(id => medicinesMap[id]).filter(Boolean);
  }

  if (results.length === 0) {
    results = localMedicines.filter(m => 
      m.category.toLowerCase().includes(c) || 
      m.uses.some(u => u.toLowerCase().includes(c))
    );
  }

  const localResults = results
    .map(m => ({
      name: m.drug_name,
      category: m.category,
      summary: m.quick_summary || (Array.isArray(m.uses) ? m.uses.join(', ') : m.uses),
      india_regulatory_status: m.india_regulatory_status
    }))
    .slice(0, 6);

  if (localResults.length > 0) return localResults;

  if (!navigator.onLine) {
    const cached = offlineService.getSearchResults(`condition_${condition}`) || [];
    return cached;
  }

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL, 
      contents: `List 12 common medicines used for "${condition}" in India. For each medicine, provide the name, category, and a 1-line summary.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: ["name", "category", "summary"]
          }
        }
      }
    });

    const parsedResults = JSON.parse(response.text || "[]");
    offlineService.saveSearchResults(`condition_${condition}`, parsedResults);
    return parsedResults;
  } catch (error) {
    console.error("Error getting medicines for condition:", error);
    return offlineService.getSearchResults(`condition_${condition}`) || [];
  }
}

export async function interpretQuery(searchQuery: string, lang: Language = 'en'): Promise<{ 
  intent: 'medicine' | 'disease' | 'compare' | 'mixed'; 
  medicines: string[]; 
  diseases: string[]; 
  specificIntent?: string;
}> {
  await ensureDataLoaded();
  const lowerQuery = searchQuery.toLowerCase().trim();
  
  if (lowerQuery.includes(' vs ') || lowerQuery.startsWith('compare ') || lowerQuery.includes(' comparison ')) {
    const parts = lowerQuery
      .replace(/^compare\s+/, '')
      .replace(/\s+comparison\s+/, ' vs ')
      .split(/\s+vs\s+|\s+and\s+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    if (parts.length >= 2) {
      return { intent: 'compare', medicines: parts, diseases: [] };
    }
  }

  const foundMed = localMedicines.find(m => 
    lowerQuery.includes(m.drug_name.toLowerCase()) || 
    m.brand_names_india.some(b => lowerQuery.includes(b.toLowerCase()))
  );

  if (foundMed) {
    return { intent: 'medicine', medicines: [foundMed.drug_name], diseases: [] };
  }

  if (!navigator.onLine) {
    return { intent: 'disease', medicines: [], diseases: [searchQuery] };
  }

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL, 
      contents: `Analyze the following search query: "${searchQuery}". Identify if the user is looking for a specific medicine, a disease, or comparing medicines.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { 
              type: Type.STRING, 
              enum: ['medicine', 'disease', 'compare', 'mixed'] 
            },
            medicines: { type: Type.ARRAY, items: { type: Type.STRING } },
            diseases: { type: Type.ARRAY, items: { type: Type.STRING } },
            specificIntent: { type: Type.STRING }
          },
          required: ["intent", "medicines", "diseases"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error interpreting query:", error);
    return { intent: 'medicine', medicines: [searchQuery], diseases: [] };
  }
}

export async function compareMedicines(med1: string, med2: string, lang: Language = 'en'): Promise<{
  med1: Medicine;
  med2: Medicine;
  comparison: {
    feature: string;
    val1: string;
    val2: string;
    difference: string;
  }[];
} | null> {
  try {
    const [data1, data2] = await Promise.all([
      fetchMedicineDetails(med1, lang),
      fetchMedicineDetails(med2, lang)
    ]);

    if (!data1 || !data2) return null;

    const basicComparison = [
      { feature: 'Generic Name', val1: data1.drug_name, val2: data2.drug_name, difference: 'Active ingredients' },
      { feature: 'Category', val1: data1.category, val2: data2.category, difference: 'Therapeutic class' },
      { feature: 'Mechanism', val1: data1.mechanism_of_action, val2: data2.mechanism_of_action, difference: 'How they work' },
      { feature: 'Common Uses', val1: Array.isArray(data1.uses) ? data1.uses.join(', ') : data1.uses, val2: Array.isArray(data2.uses) ? data2.uses.join(', ') : data2.uses, difference: 'Medical applications' },
      { feature: 'Dosage', val1: data1.dosage_common, val2: data2.dosage_common, difference: 'Typical intake' },
      { feature: 'Side Effects', val1: data1.side_effects_common.join(', '), val2: data2.side_effects_common.join(', '), difference: 'Common reactions' },
      { feature: 'Serious Risks', val1: data1.side_effects_serious?.join(', ') || 'N/A', val2: data2.side_effects_serious?.join(', ') || 'N/A', difference: 'Serious side effects' },
      { feature: 'Contraindications', val1: Array.isArray(data1.contraindications) ? data1.contraindications.join(', ') : data1.contraindications || 'N/A', val2: Array.isArray(data2.contraindications) ? data2.contraindications.join(', ') : data2.contraindications || 'N/A', difference: 'When NOT to take' },
      { feature: 'Safety', val1: data1.pregnancy_safety, val2: data2.pregnancy_safety, difference: 'Pregnancy/Nursing safety' },
    ];

    if (!navigator.onLine) {
      return { med1: data1, med2: data2, comparison: basicComparison };
    }

    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL, 
        contents: `Compare: "${med1}" and "${med2}". Focus on CDSCO guidelines for India. Provide a side-by-side comparison.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                feature: { type: Type.STRING },
                val1: { type: Type.STRING },
                val2: { type: Type.STRING },
                difference: { type: Type.STRING },
              },
              required: ["feature", "val1", "val2", "difference"]
            }
          }
        }
      });

      const comparison = JSON.parse(response.text || "[]");
      return { med1: data1, med2: data2, comparison };
    } catch (apiError) {
      console.error("Error from AI API during comparison:", apiError);
      return { med1: data1, med2: data2, comparison: basicComparison };
    }
  } catch (error) {
    console.error("Error comparing medicines:", error);
    return null;
  }
}

export async function scanMedication(base64Image: string, lang: Language = 'en'): Promise<{ name: string; category: string; description: string; confidence: number } | null> {
  const attemptScan = async (modelName: string) => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: modelName, 
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] || base64Image } },
          { text: "Extract medication name, category, and a simple description from this image. Return JSON." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ["name", "category", "description", "confidence"]
        }
      }
    });

    const match = (response.text || "").match(/\{[\s\S]*\}/);
    if (!match) return null;
    const res = JSON.parse(match[0]);
    if (!res.name || res.name.toLowerCase() === "unknown") return null;
    return res;
  };

  try {
    return await attemptScan(DEFAULT_MODEL);
  } catch (error) {
    return await attemptScan(PRO_MODEL);
  }
}

export interface PrescriptionResult {
  medicines: {
    name: string;
    dosage: string;
    timing: string;
    duration: string;
    purpose: string;
  }[];
  doctorNotes: string;
}

export interface LabReportResult {
  summary: string;
  abnormalFindings: {
    testName: string;
    result: string;
    normalRange: string;
    interpretation: 'High' | 'Low' | 'Abnormal';
  }[];
}

export async function scanPrescription(base64Image: string, lang: Language = 'en'): Promise<PrescriptionResult | null> {
  const attemptScan = async (modelName: string) => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: modelName, 
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] || base64Image } },
          { text: "Extract prescription details (medicines, dosage, timing, duration, purpose, doctorNotes). Return JSON." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            medicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  timing: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                },
                required: ["name", "dosage", "timing", "duration", "purpose"]
              }
            },
            doctorNotes: { type: Type.STRING },
          },
          required: ["medicines", "doctorNotes"]
        }
      }
    });

    const match = (response.text || "").match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  };

  try {
    return await attemptScan(DEFAULT_MODEL);
  } catch (error) {
    return await attemptScan(PRO_MODEL);
  }
}

export async function scanLabReport(base64Image: string, lang: Language = 'en'): Promise<LabReportResult | null> {
  const attemptScan = async (modelName: string) => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: modelName, 
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] || base64Image } },
          { text: "Extract lab report details (summary, abnormalFindings). Return JSON." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            abnormalFindings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  testName: { type: Type.STRING },
                  result: { type: Type.STRING },
                  normalRange: { type: Type.STRING },
                  interpretation: { type: Type.STRING },
                },
                required: ["testName", "result", "normalRange", "interpretation"]
              }
            },
          },
          required: ["summary", "abnormalFindings"]
        }
      }
    });

    const match = (response.text || "").match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  };

  try {
    return await attemptScan(DEFAULT_MODEL);
  } catch (error) {
    return await attemptScan(PRO_MODEL);
  }
}

export async function generateTTS(text: string): Promise<string | null> {
  if (text) console.log("TTS for:", text.substring(0, 20));
  return null; 
}

export async function transcribeAudio(base64Audio: string, lang: Language = 'en'): Promise<string | null> {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: "audio/webm", data: base64Audio } },
          { text: "Transcribe this audio. Return ONLY text." },
        ],
      },
    });
    return response.text?.trim() || null;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return null;
  }
}

export interface AISearchResult {
  answer: string;
  sources: { title: string; url: string }[];
}

export async function askAI(prompt: string, language: Language = 'en'): Promise<AISearchResult | null> {
  try {
    const response = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, language }),
    });

    if (!response.ok) {
      throw new Error('Server search failed');
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling AI Search API:", error);
    return null;
  }
}
