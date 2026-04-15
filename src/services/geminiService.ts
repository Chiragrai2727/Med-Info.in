import { Medicine, Language } from "../types";
import { offlineService } from "./offlineService";

// Helper to call our new backend API
async function fetchFromAPI(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(endpoint, options);
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  return res.json();
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
    const res = await fetchFromAPI(`/api/searchMedicine?query=${encodeURIComponent(query)}&lang=${lang}`);
    if (res.data) {
      offlineService.saveSearchResults(query, [res.data]);
      return res.data;
    }
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function searchMedicines(query: string, lang: Language = 'en') {
  if (!query) return [];
  try {
    const results = await fetchFromAPI(`/api/autocomplete?query=${encodeURIComponent(query)}`);
    return results.map((r: any) => ({ ...r, source: 'Verified Directory', confidence: 90 }));
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
  } catch (e) {
    return null;
  }
}

// Stubs for other functions to prevent build errors
export async function interpretQuery(query: string, lang: Language = 'en'): Promise<{ intent: string, entities: { medicine?: string, condition?: string, med1?: string, med2?: string } }> { return { intent: 'search', entities: { medicine: query } }; }
export async function scanMedication(base64Image: string, lang: Language = 'en') { return null; }
export async function scanLabReport(base64Image: string, lang: Language = 'en') { return null; }
export async function generateTTS(text: string) { return null; }
export async function transcribeAudio(base64Audio: string, lang: Language = 'en') { return null; }
