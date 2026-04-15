import { Medicine, Language } from "../types";
import { offlineService } from "./offlineService";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import conditionMedicines from "../data/condition_medicines.json";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const TEXT_MODEL = "gemini-3-flash-preview";
const VISION_MODEL = "gemini-3-flash-preview";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

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
      model: TEXT_MODEL,
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
          }
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
      Language: ${lang}.
      CRITICAL: Ensure suggestions are common in India and comply with CDSCO standards.`;

      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    summary: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      
      const content = JSON.parse(response.text || "{}");
      const aiSuggestions = content.suggestions || [];
      
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
    CRITICAL: Only list medicines approved by CDSCO.`;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
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
                  category: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  india_regulatory_status: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const content = JSON.parse(response.text || "{}");
    return content.medicines || [];
  } catch (e) {
    return [];
  }
}

export async function compareMedicines(med1: string, med2: string, lang: Language = 'en') {
  try {
    const prompt = `Compare two Indian medicines: "${med1}" vs "${med2}".
    Provide a detailed side-by-side comparison.
    Language: ${lang}.`;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            med1: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                uses: { type: Type.STRING },
                salts: { type: Type.STRING },
                side_effects: { type: Type.STRING },
                price: { type: Type.STRING },
                status: { type: Type.STRING }
              }
            },
            med2: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                uses: { type: Type.STRING },
                salts: { type: Type.STRING },
                side_effects: { type: Type.STRING },
                price: { type: Type.STRING },
                status: { type: Type.STRING }
              }
            },
            comparison: {
              type: Type.OBJECT,
              properties: {
                key_differences: { type: Type.STRING },
                verdict: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("compareMedicines error:", e);
    throw e;
  }
}

export async function scanMedication(base64Image: string, lang: Language = 'en') {
  try {
    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: {
        parts: [
          { text: `Analyze this medication image. Identify the medicine name, brand, salt composition, and provide a brief summary of its uses in ${lang}.` },
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            brand: { type: Type.STRING },
            salts: { type: Type.STRING },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("scanMedication error:", e);
    throw e;
  }
}

export interface PrescriptionResult {
  patient_name?: string;
  doctor_name?: string;
  doctorNotes?: string;
  medicines: {
    name: string;
    dosage: string;
    instructions: string;
    timing?: string;
    duration?: string;
    purpose?: string;
  }[];
  summary: string;
}

export interface LabReportResult {
  findings: {
    parameter: string;
    value: string;
    status: string;
    explanation: string;
  }[];
  summary: string;
  abnormalFindings?: {
    testName: string;
    result: string;
    normalRange: string;
    interpretation: string;
  }[];
}

export async function scanPrescription(base64Image: string, lang: Language = 'en'): Promise<PrescriptionResult | null> {
  try {
    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: {
        parts: [
          { text: `Analyze this doctor's prescription image. List all medicines mentioned, their dosages, and instructions in ${lang}.` },
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
        ]
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
                  instructions: { type: Type.STRING },
                  timing: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  purpose: { type: Type.STRING }
                }
              }
            },
            summary: { type: Type.STRING },
            doctorNotes: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("scanPrescription error:", e);
    throw e;
  }
}

export async function scanLabReport(base64Image: string, lang: Language = 'en'): Promise<LabReportResult | null> {
  try {
    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: {
        parts: [
          { text: `Analyze this lab report image. Extract key findings, abnormal values, and provide a simple explanation in ${lang}.` },
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  parameter: { type: Type.STRING },
                  value: { type: Type.STRING },
                  status: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              }
            },
            summary: { type: Type.STRING },
            abnormalFindings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  testName: { type: Type.STRING },
                  result: { type: Type.STRING },
                  normalRange: { type: Type.STRING },
                  interpretation: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("scanLabReport error:", e);
    throw e;
  }
}

export async function interpretQuery(query: string, lang: Language = 'en') {
  try {
    const prompt = `Interpret the following health-related query: "${query}".
    Identify the intent (medicine_info, condition_info, compare, scan_request, other) and extract entities (medicine names, conditions).
    Language: ${lang}.`;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
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
                condition: { type: Type.STRING },
                med1: { type: Type.STRING },
                med2: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { intent: 'medicine_info', entities: { medicine: query } };
  }
}

export async function transcribeAudio(base64Audio: string, lang: Language = 'en') {
  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: {
        parts: [
          { text: `Transcribe the following audio query accurately in ${lang}. Return only the transcribed text.` },
          { inlineData: { data: base64Audio, mimeType: "audio/webm" } }
        ]
      }
    });
    return response.text?.trim() || null;
  } catch (e) {
    console.error("transcribeAudio error:", e);
    return null;
  }
}

export async function generateTTS(text: string, lang: Language = 'en'): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: `Say: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/mp3;base64,${base64Audio}`;
    }
    return null;
  } catch (e) {
    console.error("generateTTS error:", e);
    return null;
  }
}
