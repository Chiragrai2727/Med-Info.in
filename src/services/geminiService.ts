import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Medicine, Language, LANGUAGES } from "../types";
import { offlineService } from "./offlineService";

const LANGUAGE_NAME_MAP: Record<Language, string> = LANGUAGES.reduce((acc, lang) => {
  acc[lang.code] = lang.name; // This will give us the native name
  return acc;
}, {} as Record<Language, string>);

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
import Fuse from 'fuse.js';
import medicinesData from "../data/medicines.json";
import bannedMedicinesData from "../data/banned_medicines.json";
import indexData from "../data/index.json";
import categoriesData from "../data/categories.json";
import diseasesData from "../data/diseases.json";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';

const getAIClient = (): GoogleGenAI => {
  const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  const keys = keysStr.split(',').map(k => k.trim()).filter(Boolean);
  const apiKey = keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : "";
  return new GoogleGenAI({ apiKey });
};

export const DEFAULT_MODEL = "gemini-3-flash-preview";
export const PRO_MODEL = "gemini-3.1-pro-preview";
export const TTS_MODEL = "gemini-3.1-flash-tts-preview";

const localMedicines = medicinesData as Medicine[];
const bannedMedicines = (bannedMedicinesData as any[]).map(m => ({ ...m, is_banned: true })) as Medicine[];
const allLocalMedicines = [...localMedicines, ...bannedMedicines];
const searchIndex = indexData as Record<string, string[]>;
const categoriesIndex = categoriesData as Record<string, string[]>;
const diseasesIndex = diseasesData as Record<string, string[]>;

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

// Initialize Fuse.js for fuzzy searching
const fuseOptions = {
  includeScore: true,
  threshold: 0.55, // Increased further for even better typo tolerance
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: 'drug_name', weight: 0.8 },
    { name: 'brand_names_india', weight: 0.6 },
    { name: 'category', weight: 0.2 },
    { name: 'uses', weight: 0.2 }
  ]
};
const fuse = new Fuse(allLocalMedicines, fuseOptions);

// Fast lookup map
const medicinesMap: Record<string, Medicine> = allLocalMedicines.reduce((acc, med) => {
  acc[med.id.toLowerCase()] = med;
  acc[med.drug_name.toLowerCase()] = med;
  med.brand_names_india.forEach(brand => {
    acc[brand.toLowerCase()] = med;
  });
  return acc;
}, {} as Record<string, Medicine>);

export function isDrugBanned(name: string): boolean {
  const q = name.toLowerCase().trim();
  return bannedMedicines.some(m => 
    m.drug_name.toLowerCase() === q || 
    m.brand_names_india.some(b => b.toLowerCase() === q)
  );
}

export async function fetchMedicineDetails(searchQuery: string, lang: Language = 'en'): Promise<Medicine | null> {
  const q = searchQuery.toLowerCase().trim();
  
  // 1. Check local map first (fastest) - only keep IDs or very common exact matches here
  if (medicinesMap[q]) {
    const med = medicinesMap[q];
    // If found locally, we'll try to ensure it exists in Firestore too if user is signed in
    if (auth.currentUser && med.source === 'Verified Database') {
      lazySeedToFirestore(med);
    }
    return med;
  }

  // 2. Check Firestore backend first (Primary Source of Truth)
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

  // 3. Fallback to local dataset with fuzzy match
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

  // 3. Check if it's in banned list even if not in map (extra safety)
  const bannedMed = bannedMedicines.find(m => 
    m.drug_name.toLowerCase().includes(q) || 
    m.brand_names_india.some(b => b.toLowerCase().includes(q))
  );
  if (bannedMed) return { ...bannedMed, source: 'Verified Database' };

  // 4. Check offline cache
  if (!navigator.onLine) {
    const cached = offlineService.getMedicine(searchQuery);
    if (cached) return { ...cached, source: 'Cached Result' };
    return null; // Cannot fetch new data while offline
  }

  try {
    const response = await getAIClient().models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Generate detailed medical information for the medicine: "${searchQuery}". 
      The medicine must be a legally approved medication in India.
      Verify the information against CDSCO (Central Drugs Standard Control Organization) guidelines.
      If the medicine is a brand name, identify its generic constituents.
      The response must be in ${PROMPT_LANGUAGE_MAP[lang] || 'English'}.
      Provide accurate, non-prescriptive information for educational purposes based on the latest Indian medical guidelines.`,
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

    // Save to offline cache
    offlineService.saveMedicine(medicine);
    
    // Save to Firebase Self-Building DB to help others
    if (auth.currentUser) {
      try {
        const medDocRef = doc(db, 'medicines', safeId);
        // Explicitly ensuring fields match the hardened Firestore Blueprint
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
    // Fallback to cache if network fails
    const cached = offlineService.getMedicine(searchQuery);
    if (cached) return { ...cached, source: 'Cached Result' };
    return null;
  }
}

// In-memory search cache for performance
const searchCache: Record<string, any[]> = {};

export async function searchMedicines(searchQuery: string, lang: Language = 'en'): Promise<{ name: string; category: string; summary: string; isOffline?: boolean; source?: string; confidence?: number }[]> {
  const q = searchQuery.toLowerCase().trim();
  const cacheKey = `${q}_${lang}`;
  
  if (searchCache[cacheKey]) {
    return searchCache[cacheKey];
  }

  // Instant Prefix/Exact Match Check (Pre-Parallelization)
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
    
    // For very strong matches (length 1 or exact start), return immediately for "lightning fast" feel
    if (q.length >= 3 || prefixSuggestions.some(m => m.drug_name.toLowerCase() === q)) {
      searchCache[cacheKey] = instantResults;
      return instantResults;
    }
  }

  // Parallelize backend and local search
  const [backendResults, localResults] = await Promise.all([
    (async () => {
      try {
        const qUpper = q.charAt(0).toUpperCase() + q.slice(1);
        const medicinesRef = collection(db, 'medicines');
        // Simple "starts with" query for Firestore
        const queryConstraints = [
          where('drug_name', '>=', qUpper),
          where('drug_name', '<=', qUpper + '\uf8ff'),
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
      // 1. Search in local dataset using Fuse.js (Fuzzy Search)
      const fuseResults = fuse.search(q);
      
      const diseaseMatches = new Set(diseasesIndex[q] || []);
      const categoryMatches = new Set(categoriesIndex[q] || []);

      const scoredResults = fuseResults.map(result => {
        let score = 0;
        // Fuse score is 0 (perfect) to 1 (mismatch). Threshold expanded to 0.55.
        const baseScore = Math.max(0, (0.55 - (result.score || 0)) / 0.55) * 20000;
        score += baseScore;

        const drugNameLower = result.item.drug_name.toLowerCase();
        const brandsLower = result.item.brand_names_india.map(b => b.toLowerCase());

        // Exact match boost (Highest priority - Hierarchical)
        if (drugNameLower === q) {
          score += 150000; // Generic chemical exact match
        } else if (brandsLower.includes(q)) {
          score += 100000; // Brand exact match
        } 
        // Starts with boost (High priority)
        else if (drugNameLower.startsWith(q)) {
          score += 60000;
        } else if (brandsLower.some(b => b.startsWith(q))) {
          score += 50000;
        }
        // Substring / Word Boundary token match (e.g. "plus")
        else if (drugNameLower.includes(` ${q}`) || drugNameLower.includes(`${q} `) ||
                 brandsLower.some(b => b.includes(` ${q}`) || b.includes(`${q} `))) {
          score += 25000;
        }

        // Semantic Fallback Boost
        if (diseaseMatches.has(result.item.id) || categoryMatches.has(result.item.id)) {
          score += 40000;
        }

        // Penalty for banned drugs to rank safe alternatives higher
        if (result.item.is_banned && score > 0) {
          score -= 100;
        }
        
        // Index boost (exact matches in our pre-built index)
        if (searchIndex[q]?.includes(result.item.id)) score += 20000;

        return { medicine: result.item, score };
      });

      // Add index-based matches that might have been missed by fuzzy search
      const indexMatches = new Set([...diseaseMatches, ...categoryMatches, ...(searchIndex[q] || [])]);
      indexMatches.forEach(id => {
        if (!scoredResults.some(r => r.medicine.id === id)) {
          const med = medicinesMap[id];
          if (med) {
            scoredResults.push({ medicine: med, score: 35000 });
          }
        }
      });

      const finalScored = scoredResults.filter(item => item.score >= 500);
      const sorted = finalScored.sort((a, b) => b.score - a.score);
      
      // More inclusive filtering to show more results
      const filtered = sorted.slice(0, 15);

      return filtered.map(item => {
        // Calculate a confidence score (0-100) based on the internal score
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

  // Combine results, prioritizing backend (Community DB)
  const combined = [...backendResults];
  localResults.forEach(res => {
    if (!combined.some(c => c.name.toLowerCase() === res.name.toLowerCase())) {
      combined.push(res);
    }
  });

  // Ensure we include at least some matches if they exist
  const final = combined.slice(0, 10);
  searchCache[cacheKey] = final;
  return final;
}

export async function getMedicinesForCondition(condition: string, lang: Language = 'en'): Promise<{ name: string; category: string; summary: string; india_regulatory_status?: string }[]> {
  const c = condition.toLowerCase().trim();

  // 1. Search in diseases index
  const medIds = diseasesIndex[c] || [];
  let results = medIds.map(id => medicinesMap[id]).filter(Boolean);

  // 2. Fallback to category search
  if (results.length === 0) {
    const catMeds = categoriesIndex[c] || [];
    results = catMeds.map(id => medicinesMap[id]).filter(Boolean);
  }

  // 3. Fallback to fuzzy search in uses/category
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
    return offlineService.getSearchResults(`condition_${condition}`) || [];
  }

  try {
    const response = await getAIClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `List 12 common medicines used for "${condition}" in India. 
      For each medicine, provide the name, category, and a 1-line summary.
      The response must be in ${PROMPT_LANGUAGE_MAP[lang] || 'English'}.`,
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

    const results = JSON.parse(response.text || "[]");
    offlineService.saveSearchResults(`condition_${condition}`, results);
    return results;
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
  // Basic interpretation logic
  const lowerQuery = searchQuery.toLowerCase().trim();
  
  // Improved comparison detection
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

  // Check if it's a medicine in our local dataset
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
    const response = await getAIClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following search query for a medical information app: "${searchQuery}".
      Identify if the user is looking for a specific medicine, a disease/symptom, or comparing two medicines.
      Also identify if they have a specific intent like 'dosage', 'side effects', etc.
      The response must be in English for the keys, but the values should match the query's context.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { 
              type: Type.STRING, 
              enum: ['medicine', 'disease', 'compare', 'mixed'] 
            },
            medicines: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            diseases: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
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
      { feature: 'Side Effects', val1: data1.side_effects_common.slice(0, 2).join(', '), val2: data2.side_effects_common.slice(0, 2).join(', '), difference: 'Common reactions' },
      { feature: 'Safety', val1: data1.pregnancy_safety, val2: data2.pregnancy_safety, difference: 'Pregnancy/Nursing safety' },
    ];

    // If offline, provide a comprehensive comparison from local data
    if (!navigator.onLine) {
      return { med1: data1, med2: data2, comparison: basicComparison };
    }

    try {
      const response = await getAIClient().models.generateContent({
        model: DEFAULT_MODEL,
        contents: `Compare these two medicines: "${med1}" and "${med2}".
        Provide a side-by-side comparison of their key features.
        The response must be in ${PROMPT_LANGUAGE_MAP[lang] || 'English'}.`,
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
      console.error("Error from AI API during comparison, falling back to local comparison:", apiError);
      return { med1: data1, med2: data2, comparison: basicComparison };
    }
  } catch (error) {
    console.error("Error comparing medicines:", error);
    return null;
  }
}

export async function scanMedication(base64Image: string, lang: Language = 'en'): Promise<{ name: string; category: string; description: string; confidence: number } | null> {
  const attemptScan = async (modelName: string) => {
    const response = await getAIClient().models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: `Extract the medication name from this image.
            
            CRITICAL INSTRUCTIONS:
            1. Read the LARGEST, most prominent text. This is usually the brand name (e.g., "Carnogram", "Calpol", "Dolo").
            2. Read the generic name or active ingredients if visible.
            3. Read the strength or form (e.g., "Syrup", "500mg", "Tablets").
            
            You are a pure OCR and data extraction tool. You are NOT providing medical advice.
            
            Return ONLY a valid JSON object with this exact structure:
            {
              "name": "Brand Name + Form/Strength (e.g., 'Carnogram Syrup' or 'Calpol 500mg')",
              "category": "Therapeutic category (e.g., Supplement, Analgesic, Antibiotic)",
              "description": "A 1-2 sentence simple description of what this medicine is typically used for in ${PROMPT_LANGUAGE_MAP[lang] || 'English'}.",
              "confidence": 95
            }
            
            If no medicine is found in the image, return {"name": "", "category": "", "description": "", "confidence": 0}.`,
          },
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

    const text = response.text;
    if (!text) {
      throw new Error("Received empty response from AI model.");
    }
    
    // Extract JSON using regex in case the model wraps it in markdown or extra text
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Could not find JSON in AI response.");
    }
    
    const result = JSON.parse(match[0]);
    if (!result.name || result.name.trim() === "" || result.name.toLowerCase() === "unknown") return null;
    return result;
  };

  try {
    // Try FLASH first because it has a 15 RPM limit
    return await attemptScan(DEFAULT_MODEL);
  } catch (error: any) {
    console.warn("Primary model (flash) failed, attempting fallback to pro model...", error);
    
    if (error.message?.includes("API key") || error.message?.includes("403") || error.message?.includes("quota") || error.message?.includes("429")) {
      throw error;
    }

    try {
      // Fallback to the Pro model only for reasoning/parsing failures
      return await attemptScan(PRO_MODEL);
    } catch (fallbackError: any) {
      console.error("Both primary and fallback models failed:", fallbackError);
      throw fallbackError; // Throw the final error so the UI can display it
    }
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

// Prescription scan helper
export async function scanPrescription(base64Image: string, lang: Language = 'en'): Promise<PrescriptionResult | null> {
  const attemptScan = async (modelName: string) => {
    const response = await getAIClient().models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: `Extract the prescription details from this image.
            
            CRITICAL INSTRUCTIONS:
            1. Read the handwritten or printed doctor's prescription carefully.
            2. Extract every medicine prescribed, including its dosage (e.g., 500mg), timing (e.g., 1-0-1, twice a day), duration (e.g., 5 days), and infer the purpose if possible.
            3. Extract any additional doctor's notes or advice.
            
            Return ONLY a valid JSON object with this exact structure:
            {
              "medicines": [
                {
                  "name": "Medicine Name",
                  "dosage": "Dosage (e.g., 500mg)",
                  "timing": "Timing/Frequency (e.g., Morning & Night, 1-0-1)",
                  "duration": "Duration (e.g., 5 days)",
                  "purpose": "Inferred purpose or what it is usually for in ${PROMPT_LANGUAGE_MAP[lang] || 'English'}"
                }
              ],
              "doctorNotes": "Any other advice or notes written by the doctor"
            }
            
            If no prescription is found, return {"medicines": [], "doctorNotes": ""}.`,
          },
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

    const text = response.text;
    if (!text) throw new Error("Received empty response from AI model.");
    
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not find JSON in AI response.");
    
    const result = JSON.parse(match[0]);
    if (!result.medicines || result.medicines.length === 0) return null;
    return result;
  };

  try {
    return await attemptScan(DEFAULT_MODEL);
  } catch (error: any) {
    if (error.message?.includes("API key") || error.message?.includes("403") || error.message?.includes("quota") || error.message?.includes("429")) {
      throw error;
    }
    return await attemptScan(PRO_MODEL);
  }
}

// Lab report scan helper
export async function scanLabReport(base64Image: string, lang: Language = 'en'): Promise<LabReportResult | null> {
  const attemptScan = async (modelName: string) => {
    const response = await getAIClient().models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: `Extract the medical test report details from this image.
            
            CRITICAL INSTRUCTIONS:
            1. Read the lab report (e.g., blood test, urine test).
            2. Identify any abnormal findings where the result is outside the normal reference range.
            3. Provide a simple, 2-3 sentence overall summary of the report in ${lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : lang === 'mr' ? 'Marathi' : 'Tamil'}.
            
            Return ONLY a valid JSON object with this exact structure:
            {
              "summary": "Overall summary of the report in simple terms.",
              "abnormalFindings": [
                {
                  "testName": "Name of the test (e.g., Hemoglobin)",
                  "result": "The patient's result (e.g., 10.5 g/dL)",
                  "normalRange": "The normal reference range (e.g., 12.0 - 15.5 g/dL)",
                  "interpretation": "High" // Must be exactly "High", "Low", or "Abnormal"
                }
              ]
            }
            
            If no lab report is found, return {"summary": "", "abnormalFindings": []}.`,
          },
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

    const text = response.text;
    if (!text) throw new Error("Received empty response from AI model.");
    
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not find JSON in AI response.");
    
    const result = JSON.parse(match[0]);
    if (!result.summary || result.summary.trim() === "") return null;
    return result;
  };

  try {
    return await attemptScan(DEFAULT_MODEL);
  } catch (error: any) {
    if (error.message?.includes("API key") || error.message?.includes("403") || error.message?.includes("quota") || error.message?.includes("429")) {
      throw error;
    }
    return await attemptScan(PRO_MODEL);
  }
}

export async function generateTTS(text: string): Promise<string | null> {
  // Speech synthesis is much faster and reliable for browser-based TTS than AI generation in most cases.
  // However, if we want to use Gemini 2.0's real-time voice, it requires specific model selection.
  // For now, we will fallback to browser SpeechSynthesis as it is more robust across devices.
  return null; 
}

export async function transcribeAudio(base64Audio: string, lang: Language = 'en'): Promise<string | null> {
  try {
    const response = await getAIClient().models.generateContent({
      model: DEFAULT_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/webm",
              data: base64Audio,
            },
          },
          {
            text: `Transcribe the following audio query into text. 
            The audio is likely a medical query or a medicine name in ${lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : lang === 'mr' ? 'Marathi' : 'Tamil'}.
            Return ONLY the transcribed text, nothing else.`,
          },
        ],
      },
    });

    return response.text?.trim() || null;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return null;
  }
}
