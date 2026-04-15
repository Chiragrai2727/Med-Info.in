import { Medicine, Language } from "../types";
import { offlineService } from "./offlineService";
import { GoogleGenAI, Type } from "@google/genai";
import conditionMedicines from "../data/condition_medicines.json";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const MODEL_NAME = "gemini-3-flash-preview";

// Helper to call our new backend API (for non-AI tasks like autocomplete)
async function fetchFromAPI(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(endpoint, options);
  
  const contentType = res.headers.get("content-type");
  if (!res.ok || !contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    console.error(`API Error (${endpoint}):`, text);
    
    if (text.includes("<!DOCTYPE html>") || text.includes("<!doctype html>")) {
      throw new Error("Server returned an HTML page instead of data. This usually means the API route was not found (404).");
    }
    
    try {
      const data = JSON.parse(text);
      if (data && data.error === "Invalid API Key") {
        throw new Error(data.details);
      }
      throw new Error(data?.error || `API Error: ${res.statusText}`);
    } catch (e) {
      throw new Error(`API Error (${res.status}): ${res.statusText}`);
    }
  }
  
  return await res.json();
}

export function isDrugBanned(name: string): boolean {
  return false; 
}

export async function fetchMedicineDetails(query: string, lang: Language = 'en'): Promise<Medicine | null> {
  // 1. Check offline cache first
  const cached = offlineService.getMedicine(query);
  if (cached) return { ...cached, source: 'Verified Database' };

  if (!navigator.onLine) return null;

  try {
    const languageMap: Record<string, string> = {
      'en': 'English',
      'hi': 'Hindi',
      'mr': 'Marathi',
      'ta': 'Tamil'
    };
    
    const prompt = `Provide detailed medical information for the medicine "${query}".
    The response MUST be in ${languageMap[lang as string] || 'English'}.
    CRITICAL: Verify the information against CDSCO (Central Drugs Standard Control Organization) guidelines for India.
    Include all fields required by the schema accurately. For arrays, provide a list of strings.
    If the drug is banned in India, set "is_banned" to true.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            drug_name: { type: Type.STRING },
            brand_names_india: { type: Type.ARRAY, items: { type: Type.STRING } },
            category: { type: Type.STRING },
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
            is_banned: { type: Type.BOOLEAN }
          },
          required: [
            "drug_name", "brand_names_india", "category", "drug_class", "mechanism_of_action",
            "uses", "dosage_common", "side_effects_common", "side_effects_serious", "overdose_effects",
            "contraindications", "drug_interactions", "pregnancy_safety", "kidney_liver_warning",
            "how_it_works_in_body", "onset_of_action", "duration_of_effect", "prescription_required",
            "ayurvedic_or_allopathic", "india_regulatory_status", "quick_summary", "who_should_take",
            "who_should_not_take", "food_interactions", "alcohol_warning", "missed_dose"
          ]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    if (data.drug_name) {
      const medicineData = { ...data, source: 'AI Analysis' };
      offlineService.saveMedicine(medicineData);
      return medicineData;
    }
    throw new Error("Medicine data not found in response");
  } catch (e: any) {
    console.error("fetchMedicineDetails error:", e);
    throw e;
  }
}

export async function searchMedicines(query: string, lang: Language = 'en') {
  if (!query) return [];
  try {
    // 1. Try local autocomplete first
    const results = await fetchFromAPI(`/api/autocomplete?query=${encodeURIComponent(query)}`);
    const formattedResults = results.map((r: any) => ({ ...r, source: 'Verified Directory', confidence: 95 }));
    
    // 2. If we have enough results, return them
    if (formattedResults.length >= 3) return formattedResults;
    
    // 3. Otherwise, ask AI for suggestions
    try {
      const prompt = `Suggest 5 Indian medicines or health conditions matching "${query}".
      Return JSON array of objects with: name, category, summary.
      Language: ${lang}.
      CRITICAL: Ensure suggestions are common in India and comply with CDSCO standards.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                summary: { type: Type.STRING }
              },
              required: ["name", "category", "summary"]
            }
          }
        }
      });
      
      const aiSuggestions = JSON.parse(response.text || "[]");
      
      // Merge and remove duplicates
      const allResults = [...formattedResults];
      aiSuggestions.forEach((s: any) => {
        if (!allResults.some(r => r.name.toLowerCase() === s.name.toLowerCase())) {
          allResults.push({ ...s, source: 'AI Analysis', confidence: 85 });
        }
      });
      
      return allResults.slice(0, 8);
    } catch (aiErr) {
      return formattedResults;
    }
  } catch (e) {
    return [];
  }
}

export async function getMedicinesForCondition(condition: string, lang: Language = 'en') {
  // 1. Check local mapping for common conditions (Instant load)
  const conditionKey = condition.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
  const localData = (conditionMedicines as any)[conditionKey];
  if (localData) return localData;

  try {
    const prompt = `List 6 common medicines used for "${condition}" in India. 
    Language: ${lang}.
    CRITICAL: Only list medicines approved by CDSCO.
    Return JSON array of objects with: name, category, summary, india_regulatory_status.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
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
              india_regulatory_status: { type: Type.STRING }
            },
            required: ["name", "category", "summary"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
}

export async function compareMedicines(med1: string, med2: string, lang: Language = 'en') {
  try {
    const prompt = `Compare the medicines "${med1}" and "${med2}".
    Language: ${lang}.
    Return JSON with:
    - similarities (array of strings)
    - differences (array of strings)
    - interactions (string describing if they interact with each other)
    - recommendation (string)`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            similarities: { type: Type.ARRAY, items: { type: Type.STRING } },
            differences: { type: Type.ARRAY, items: { type: Type.STRING } },
            interactions: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          },
          required: ["similarities", "differences", "interactions", "recommendation"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
}

export interface PrescriptionResult {
  patient_name?: string;
  doctor_name?: string;
  doctorNotes?: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    timing?: string;
    purpose?: string;
  }[];
  general_advice?: string;
}

export interface LabReportResult {
  patient_name?: string;
  test_date?: string;
  parameters: {
    name: string;
    value: string;
    unit: string;
    reference_range: string;
    status: 'Normal' | 'High' | 'Low' | 'Critical';
    interpretation: string;
  }[];
  summary: string;
  recommendations: string[];
  abnormalFindings?: {
    testName: string;
    result: string;
    normalRange: string;
    interpretation: string;
  }[];
}

export async function scanPrescription(base64Image: string, lang: Language = 'en'): Promise<PrescriptionResult | null> {
  try {
    const prompt = `Analyze this prescription image. Extract the medicines prescribed.
    Return JSON with:
    - patient_name (string or null)
    - doctor_name (string or null)
    - medicines (array of objects with: name, dosage, frequency, duration, instructions)
    - general_advice (string)
    Language: ${lang}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        prompt,
        { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: "image/jpeg" } }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patient_name: { type: Type.STRING },
            doctor_name: { type: Type.STRING },
            medicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  instructions: { type: Type.STRING }
                },
                required: ["name", "dosage", "frequency", "duration", "instructions"]
              }
            },
            general_advice: { type: Type.STRING }
          },
          required: ["medicines", "general_advice"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e: any) {
    console.error("scanPrescription error:", e);
    return null;
  }
}

export async function scanMedication(base64Image: string, lang: Language = 'en'): Promise<{ name: string; category: string; description: string; confidence: number } | null> {
  try {
    const prompt = `Identify the medicine in this image. Provide its name, category, a brief description, and your confidence level (0-100).
    Language: ${lang}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        prompt,
        { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: "image/jpeg" } }
      ],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["name", "category", "description", "confidence"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e: any) {
    console.error("scanMedication error:", e);
    return null;
  }
}

export async function scanLabReport(base64Image: string, lang: Language = 'en'): Promise<LabReportResult | null> {
  try {
    const prompt = `Analyze this lab report image. Extract the patient name, test date, and all test parameters (name, value, unit, reference range).
    For each parameter, determine the status (Normal, High, Low, Critical) and provide a brief interpretation.
    Finally, provide an overall summary and recommendations.
    Language: ${lang}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        prompt,
        { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: "image/jpeg" } }
      ],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patient_name: { type: Type.STRING },
            test_date: { type: Type.STRING },
            parameters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  reference_range: { type: Type.STRING },
                  status: { type: Type.STRING },
                  interpretation: { type: Type.STRING }
                },
                required: ["name", "value", "unit", "reference_range", "status", "interpretation"]
              }
            },
            summary: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            abnormalFindings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  testName: { type: Type.STRING },
                  result: { type: Type.STRING },
                  normalRange: { type: Type.STRING },
                  interpretation: { type: Type.STRING }
                },
                required: ["testName", "result", "normalRange", "interpretation"]
              }
            }
          },
          required: ["parameters", "summary", "recommendations"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e: any) {
    console.error("scanLabReport error:", e);
    return null;
  }
}

// Stubs for other functions to prevent build errors
export async function interpretQuery(query: string, lang: Language = 'en'): Promise<{ intent: string, entities: { medicine?: string, condition?: string, med1?: string, med2?: string } }> {
  try {
    const prompt = `Analyze the user query: "${query}". 
    Determine the intent: 'search' (single medicine), 'compare' (two medicines), or 'condition' (medicines for a disease).
    Extract entities: 'medicine' (name), 'med1', 'med2', 'condition'.
    Return JSON only.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING },
            entities: {
              type: Type.OBJECT,
              properties: {
                medicine: { type: Type.STRING },
                med1: { type: Type.STRING },
                med2: { type: Type.STRING },
                condition: { type: Type.STRING }
              }
            }
          },
          required: ['intent', 'entities']
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("interpretQuery error:", e);
    return { intent: 'search', entities: { medicine: query } };
  }
}

export async function transcribeAudio(base64Audio: string, lang: Language = 'en') {
  try {
    const prompt = "Transcribe this audio. Return only the transcription text.";

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { text: prompt },
        { inlineData: { data: base64Audio, mimeType: 'audio/webm' } }
      ]
    });

    return response.text;
  } catch (e) {
    console.error("transcribeAudio error:", e);
    return null;
  }
}
export async function generateTTS(text: string) { return null; }
