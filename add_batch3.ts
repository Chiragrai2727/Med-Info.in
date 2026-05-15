import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';

const apiKey = process.env.GEMINI_API_KEY || (process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',')[0] : "");
if (!apiKey) {
  console.error("No Gemini API key found in environment variables.");
  process.exit(1);
}
const genAI = new GoogleGenAI({ apiKey: apiKey.trim() });

const medicineNames = [
  "DIVAA OD 250MG",
  "DNS (FKB)",
  "DOLO 650",
  "DOLONEX 20 DT",
  "DOXINATE PLUS",
  "DOXOLIN 400MG",
  "DOXY 1 LDR FORTE",
  "DROTIN TAB",
  "DUET 625",
  "DULCOFLEX TABS",
  "DUOLIN INHALER",
  "DUVADILAN 10MG",
  "DYNAPAR",
  "DYTOR 10MG",
  "ELTROXIN 50MCG",
  "EMANZEN D",
  "ENZOFAM",
  "EPTOIN 100MG",
  "ESLO 5MG",
  "ESOMAC 40",
  "ETILAAM 0.5 MG",
  "ETORVEL 90MG",
  "ETOVA MR",
  "EUPAN DSR",
  "EVION 400MG",
  "FALCIGO 120 INJECTION",
  "FEBUGET 40MG",
  "FERIUM XT",
  "FLAGYL 400MG",
  "FLUNARIN 10MG",
  "FLUVIR 75MG",
  "FOLITRAX 15MG",
  "FORACORT 100 INHALER",
  "FRISIUM 10MG",
  "FRUSEMIDE INJECTION",
  "GANATON TOTAL",
  "GASEX",
  "GELUSIL MPS TAB",
  "GEMCAL PLUS",
  "GLIMESTAR M1",
  "GLISAVE M2",
  "GLIZID M"
];

async function generateMedicineData(name: string) {
  const prompt = `Generate detailed pharmaceutical data for the following Indian medicine: "${name}".
  Follow this JSON schema:
  {
    "id": "unique_string_id",
    "category": "Category name",
    "drug_name": "Full Drug Name includes strength",
    "brand_names_india": ["Brand1", "Brand2"],
    "drug_class": "Class Name",
    "mechanism_of_action": "Description",
    "uses": ["Use1", "Use2"],
    "dosage_common": "Dosage string",
    "side_effects_common": ["Effect1", "Effect2"],
    "side_effects_serious": ["Serious1", "Serious2"],
    "overdose_effects": "Description",
    "contraindications": ["Contra1", "Contra2"],
    "drug_interactions": ["Int1", "Int2"],
    "pregnancy_safety": "Category and description",
    "kidney_liver_warning": "Warning description",
    "how_it_works_in_body": "Detailed description",
    "onset_of_action": "Time",
    "duration_of_effect": "Time",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Brief summary",
    "who_should_take": "Description",
    "who_should_not_take": "Description",
    "food_interactions": ["Food1"],
    "alcohol_warning": "Warning",
    "missed_dose": "Advice"
  }
  Ensure "brand_names_india" includes the searched name.
  Verify information against CDSCO standards.
  Return ONLY the JSON.`;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const text = result.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error(`Error generating data for ${name}:`, error);
    return null;
  }
}

async function main() {
  const medicinesPath = path.join(process.cwd(), 'src/data/medicines.json');
  const existingMeds: any[] = JSON.parse(fs.readFileSync(medicinesPath, 'utf8'));
  
  const newMeds = [];
  for (const name of medicineNames) {
    // Check if already exists (approximate match)
    const exists = existingMeds.some(m => 
      m.brand_names_india?.some((bn: string) => bn.toLowerCase() === name.toLowerCase()) ||
      m.drug_name?.toLowerCase().includes(name.toLowerCase())
    );

    if (exists) {
      console.log(`Skipping ${name}, already in dataset.`);
      continue;
    }

    console.log(`Generating data for ${name}...`);
    const data = await generateMedicineData(name);
    if (data) {
      newMeds.push(data);
      // Save incrementally to avoid losing data on crash/timeout
      const currentMeds = JSON.parse(fs.readFileSync(medicinesPath, 'utf8'));
      fs.writeFileSync(medicinesPath, JSON.stringify([...currentMeds, data], null, 2));
    }
    // Delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log(`Added ${newMeds.length} new medicines in this run.`);
}

main();
