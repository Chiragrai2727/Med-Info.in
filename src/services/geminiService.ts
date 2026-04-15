import { Medicine, Language } from "../types";
import { offlineService } from "./offlineService";

// Helper to call our new backend API
async function fetchFromAPI(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(endpoint, options);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (data && data.error === "Invalid API Key") {
      throw new Error(data.details);
    }
    throw new Error(data?.error || `API Error: ${res.statusText}`);
  }
  return data;
}

export function isDrugBanned(name: string): boolean {
  return false; 
}

export async function fetchMedicineDetails(query: string, lang: Language = 'en'): Promise<Medicine | null> {
  if (!navigator.onLine) {
    const cached = offlineService.getSearchResults(query);
    if (cached && cached.length > 0) return cached[0] as unknown as Medicine;
    return null;
  }
  try {
    const res = await fetch(`/api/searchMedicine?query=${encodeURIComponent(query)}&lang=${lang}`);
    const data = await res.json();
    if (!res.ok) {
      if (data.error === "Invalid API Key") {
        throw new Error(data.details);
      }
      throw new Error(data.error || `API Error: ${res.statusText}`);
    }
    if (data.data) {
      offlineService.saveSearchResults(query, [data.data]);
      return data.data;
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
      const aiSuggestions = await fetchFromAPI('/api/searchSuggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, lang })
      });
      
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
  try {
    return await fetchFromAPI('/api/conditionSearch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ condition, lang })
    });
  } catch (e) {
    return [];
  }
}

export async function compareMedicines(med1: string, med2: string, lang: Language = 'en') {
  try {
    return await fetchFromAPI('/api/compareMedicines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ med1, med2, lang })
    });
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
    return await fetchFromAPI('/api/scanPrescription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, lang })
    });
  } catch (e: any) {
    if (e.message?.includes("API key")) throw e;
    return null;
  }
}

export async function scanMedication(base64Image: string, lang: Language = 'en'): Promise<{ name: string; category: string; description: string; confidence: number } | null> {
  try {
    return await fetchFromAPI('/api/scanMedication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, lang })
    });
  } catch (e: any) {
    if (e.message?.includes("API key")) throw e;
    return null;
  }
}

export async function scanLabReport(base64Image: string, lang: Language = 'en'): Promise<LabReportResult | null> {
  try {
    return await fetchFromAPI('/api/scanLabReport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, lang })
    });
  } catch (e: any) {
    if (e.message?.includes("API key")) throw e;
    return null;
  }
}

// Stubs for other functions to prevent build errors
export async function interpretQuery(query: string, lang: Language = 'en'): Promise<{ intent: string, entities: { medicine?: string, condition?: string, med1?: string, med2?: string } }> {
  try {
    const data = await fetchFromAPI('/api/interpretQuery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, lang })
    });
    return data;
  } catch (e) {
    console.error("interpretQuery error:", e);
    return { intent: 'search', entities: { medicine: query } };
  }
}
export async function transcribeAudio(base64Audio: string, lang: Language = 'en') {
  try {
    const data = await fetchFromAPI('/api/transcribeAudio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Audio, lang })
    });
    return data.transcript;
  } catch (e) {
    console.error("transcribeAudio error:", e);
    return null;
  }
}
export async function generateTTS(text: string) { return null; }
