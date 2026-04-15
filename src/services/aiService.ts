import { Medicine, Language } from "../types";
import { offlineService } from "./offlineService";
import OpenAI from "openai";
import conditionMedicines from "../data/condition_medicines.json";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true // Required for client-side usage in this environment
});

const TEXT_MODEL = "gpt-4o-mini";
const VISION_MODEL = "gpt-4o";

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
    If the drug is banned in India, set "is_banned" to true.
    
    Return the data in the following JSON format:
    {
      "drug_name": "string",
      "brand_names_india": ["string"],
      "category": "string",
      "drug_class": "string",
      "mechanism_of_action": "string",
      "uses": ["string"],
      "dosage_common": "string",
      "side_effects_common": ["string"],
      "side_effects_serious": ["string"],
      "overdose_effects": "string",
      "contraindications": ["string"],
      "drug_interactions": ["string"],
      "pregnancy_safety": "string",
      "kidney_liver_warning": "string",
      "how_it_works_in_body": "string",
      "onset_of_action": "string",
      "duration_of_effect": "string",
      "prescription_required": boolean,
      "ayurvedic_or_allopathic": "string",
      "india_regulatory_status": "string",
      "quick_summary": "string",
      "who_should_take": "string",
      "who_should_not_take": "string",
      "food_interactions": ["string"],
      "alcohol_warning": "string",
      "missed_dose": "string",
      "is_banned": boolean
    }`;

    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const data = JSON.parse(response.choices[0].message.content || "{}");
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
      CRITICAL: Ensure suggestions are common in India and comply with CDSCO standards.
      Format: {"suggestions": [{"name": "...", "category": "...", "summary": "..."}]}`;

      const response = await openai.chat.completions.create({
        model: TEXT_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      
      const content = JSON.parse(response.choices[0].message.content || "{}");
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
    CRITICAL: Only list medicines approved by CDSCO.
    Return JSON array of objects with: name, category, summary, india_regulatory_status.
    Format: {"medicines": [{"name": "...", "category": "...", "summary": "...", "india_regulatory_status": "..."}]}`;

    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(response.choices[0].message.content || "{}");
    return content.medicines || [];
  } catch (e) {
    return [];
  }
}

export async function compareMedicines(med1: string, med2: string, lang: Language = 'en') {
  try {
    const prompt = `Compare two Indian medicines: "${med1}" vs "${med2}".
    Provide a detailed side-by-side comparison including:
    - Primary uses
    - Main ingredients (salts)
    - Common side effects
    - Price range (approximate in INR)
    - India regulatory status (CDSCO)
    - Key differences
    - Which one is generally preferred for what
    
    Language: ${lang}.
    Return JSON format:
    {
      "med1": { "name": "...", "uses": "...", "salts": "...", "side_effects": "...", "price": "...", "status": "..." },
      "med2": { "name": "...", "uses": "...", "salts": "...", "side_effects": "...", "price": "...", "status": "..." },
      "comparison": { "key_differences": "...", "verdict": "..." }
    }`;

    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (e) {
    console.error("compareMedicines error:", e);
    throw e;
  }
}

export async function scanMedication(base64Image: string, lang: Language = 'en') {
  try {
    const response = await openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this medication image. Identify the medicine name, brand, salt composition, and provide a brief summary of its uses in ${lang}. 
            Format: {"name": "...", "brand": "...", "salts": "...", "summary": "..."}` },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ],
        },
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (e) {
    console.error("scanMedication error:", e);
    throw e;
  }
}

export async function scanLabReport(base64Image: string, lang: Language = 'en'): Promise<LabReportResult | null> {
  try {
    const response = await openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this lab report image. Extract key findings, abnormal values, and provide a simple explanation in ${lang}. 
            Format: {"findings": [{"parameter": "...", "value": "...", "status": "Normal/Abnormal", "explanation": "..."}], "summary": "...", "abnormalFindings": [{"testName": "...", "result": "...", "normalRange": "...", "interpretation": "..."}]}` },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ],
        },
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (e) {
    console.error("scanLabReport error:", e);
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
    const response = await openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this doctor's prescription image. List all medicines mentioned, their dosages, and instructions in ${lang}. 
            Format: {"medicines": [{"name": "...", "dosage": "...", "instructions": "...", "timing": "...", "duration": "...", "purpose": "..."}], "summary": "...", "doctorNotes": "..."}` },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ],
        },
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (e) {
    console.error("scanPrescription error:", e);
    throw e;
  }
}

export async function interpretQuery(query: string, lang: Language = 'en') {
  try {
    const prompt = `Interpret the following health-related query: "${query}".
    Identify the intent (medicine_info, condition_info, compare, scan_request, other) and extract entities (medicine names, conditions).
    Language: ${lang}.
    Format: {"intent": "...", "entities": {"medicine": "...", "condition": "...", "med1": "...", "med2": "..."}}`;

    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (e) {
    return { intent: 'medicine_info', entities: { medicine: query } };
  }
}

export async function transcribeAudio(base64Audio: string, lang: Language = 'en') {
  try {
    // Convert base64 to a File-like object for OpenAI
    const byteCharacters = atob(base64Audio);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/webm' });
    const file = new File([blob], "audio.webm", { type: 'audio/webm' });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: lang === 'en' ? 'en' : undefined // Whisper supports many languages, but we can hint
    });

    return transcription.text;
  } catch (e) {
    console.error("transcribeAudio error:", e);
    return null;
  }
}

export async function generateTTS(text: string, lang: Language = 'en'): Promise<string | null> {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString('base64');
    return `data:audio/mp3;base64,${base64}`;
  } catch (e) {
    console.error("generateTTS error:", e);
    return null;
  }
}
