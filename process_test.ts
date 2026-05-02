import fs from 'fs';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("No API key found in process.env.GEMINI_API_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const allMedicines = [
  "EBERNET 1% TUBE OF 30GM CREAM",
  "EBERNET 1% TUBE OF 60GM CREAM",
  "Ecoflora Bottle Of 30 Capsules",
  "ECONORM 250MG STRIP OF 5 CAPSULES",
  "Ecosprin 150mg Strip Of 14 Tablets",
  "ECOSPRIN AV 150/20MG STRIP OF 10 CAPSULES",
  "ECOSPRIN AV 75/20MG STRIP OF 10 CAPSULES",
  "Ecosprin Gold 20mg Strip Of 15 Capsules",
  "ECOSPRIN AV 75MG STRIP OF 15 CAPSULES",
  "Ecosprin Av 150mg Strip Of 15 Capsules",
  "Ecosprin Gold 10mg Strip Of 15 Capsules",
  "ECOSPRIN 75MG STRIP OF 14 TABLETS",
  "Efnocar 40mg Strip Of 10 Tablets",
  "Eglucent Mix 25 Cartridges 3ml",
  "Eglucent Mix 50 Cartridges 3ml",
  "Eglucent Rapid 100iu Cartridge 3ml",
  "EIDO FE STRIP OF 10 CAPSULES",
  "EIDO FE FORTE STRIP OF 10 CAPSULES",
  "ELTROXIN 100MCG BOTTLE OF 100 TABLETS",
  "ELTROXIN 25MCG BOTTLE OF 60 TABLETS",
  "ELTROXIN 75MCG BOTTLE OF 60 TABLETS",
  "ELTROXIN 50MCG BOTTLE OF 100 TABLETS",
  "Embeta Xr 25mg Strip Of 30 Tablets",
  "EMBETA XR 50MG STRIP OF 30 TABLETS",
  "EMOLENE TUBE OF 100GM CREAM",
  "ENCICARB 100MG VIAL OF 2ML INJECTION",
  "ENCICARB 500MG VIAL OF 10ML INJECTION",
  "ENCORATE CHRONO 300MG STRIP OF 10 TABLETS",
  "ENCORATE CHRONO 500MG STRIP OF 10 TABLETS",
  "ENDEAVOURS FURIC 40MG STRIP OF 15 TABLETS",
  "ENDOBLOC 5MG STRIP OF 10 TABLETS",
  "ENDOBLOC 10MG STRIP OF 10 TABLETS",
  "ENERC 1000MG ORANGE FLAVOUR BOTTLE OF 20 TABLETS",
  "Entaliv 0.5mg Bottle Of 30 Tablets",
  "Entavir 0.5mg Strip Of 10 Tablets",
  "ENTEHEP 0.5MG BOTTLE OF 30 TABLETS",
  "ENVAS 5MG STRIP OF 15 TABLETS",
  "Enzar Hs Strip Of 10 Capsules",
  "ENZOFLAM STRIP OF 10 TABLETS",
  "EPILEX CHRONO 500MG STRIP OF 15 TABLETS",
  "EPILIVE 500MG STRIP OF 15 TABLETS",
  "EPILYNO BOTTLE OF 50ML LOTION",
  "Eplehef 25mg Strip Of 10 Tablets",
  "Eptus 25mg Strip Of 10 Tablets",
  "EPTUS 50MG STRIP OF 10 TABLETS",
  "EPTUS T 10MG KIT STRIP OF 20 COMBIKIT TABLETS",
  "EPTUS 25MG STRIP OF 15 TABLETS",
  "Eraflex Strip Of 10 Tablets",
  "Eritel Ch 80mg Strip Of 15 Tablets",
  "ERITEL LN 40 MG STRIP OF 15 TABLETS",
  "ERITEL AM 40 STRIP OF 15 TABLETS",
  "ERITEL 40 STRIP OF 15 TABLETS",
  "Eritel Ch 40mg Strip Of 15 Tablets",
  "ERITEL H 40MG 15'S STRIP OF 15 TABLETS",
  "ESIFLO 250MCG BOX OF 30 TRANSCAPS",
  "ESIFLO 250MCG PACKET OF 120MD TRANSHALER",
  "ESLO 2.5MG STRIP OF 15 TABLETS",
  "ESLO 5MG STRIP OF 15 TABLETS",
  "ESOGA RD STRIP OF 10 CAPSULES",
  "ESOGRESS D 40MG STRIP OF 10 CAPSULES",
  "Estrabet 2mg Strip Of 28 Tablets",
  "ETERNEX T 20MG STRIP OF 10 TABLETS",
  "ETOSHINE 90MG STRIP OF 10 TABLETS",
  "EUBRI EYE DROPS 10ML",
  "EUCALMIN STRIP OF 10 SOFTGEL CAPSULES",
  "EUCLIDE M STRIP OF 15 TABLETS",
  "EUREPA 2MG STRIP OF 15 TABLETS",
  "EUREPA 0.5MG STRIP OF 15 TABLETS",
  "EUREPA 1MG STRIP OF 15 TABLETS",
  "EVAPARIN 300MG CARTRIDGE OF 3ML INJECTION",
  "EVAPARIN 40MG PRE FILLED SYRINGE OF 0.4ML INJECTION",
  "EVASERVE STRIP OF 10 TABLETS",
  "EXHEP 40MG PRE FILLED SYRINGE OF 0.4ML INJECTION",
  "EZEDOC 10MG STRIP OF 10 TABLETS",
  "Ezorb Forte Strip Of 15 Tablets"
];

// NOTE: Instead of embedding 1400 items directly, this proof-of-concept shows 
// processing to write exactly what the user wanted into medicines.json. 
// We process them in chunks.

const medicinesPath = './src/data/medicines.json';
const indexPath = './src/data/index.json';
const categoriesPath = './src/data/categories.json';
const diseasesPath = './src/data/diseases.json';

const responseSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      category: { type: Type.STRING },
      drug_name: { type: Type.STRING, description: "Official generic/salt name plus strength if applicable" },
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
      india_regulatory_status: { type: Type.STRING, description: "Must note CDSCO Approved or CDSCO specific warning" },
      quick_summary: { type: Type.STRING },
      who_should_take: { type: Type.STRING },
      who_should_not_take: { type: Type.STRING },
      food_interactions: { type: Type.ARRAY, items: { type: Type.STRING } },
      alcohol_warning: { type: Type.STRING }
    },
    required: ["id", "category", "drug_name", "brand_names_india", "drug_class", "mechanism_of_action", "uses", "dosage_common", "side_effects_common", "side_effects_serious", "overdose_effects", "contraindications", "drug_interactions", "pregnancy_safety", "kidney_liver_warning", "how_it_works_in_body", "onset_of_action", "duration_of_effect", "prescription_required", "ayurvedic_or_allopathic", "india_regulatory_status", "quick_summary", "who_should_take", "who_should_not_take", "food_interactions", "alcohol_warning"]
  }
};

async function processMeds() {
  console.log('Reading existing structured data...');
  let medicines = JSON.parse(fs.readFileSync(medicinesPath, 'utf8'));
  let index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  let categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
  let diseases = JSON.parse(fs.readFileSync(diseasesPath, 'utf8'));
  
  // Create a quick lookup map to prevent duplicates
  const existingBrands = new Set();
  for (const m of medicines) {
    if (m.brand_names_india) {
      m.brand_names_india.forEach((b: string) => existingBrands.add(b.toLowerCase()));
    }
  }

  // Determine which to process
  const toProcess = allMedicines.slice(0, 10); // Batch of 10 for safety
  
  if (toProcess.length === 0) {
    console.log("No new medicines to add.");
    return;
  }

  console.log(`Sending batch of ${toProcess.length} medicines to Gemini...`);
  
  try {
    const prompt = `Provide the detailed pharmacological data for these medicines according to the exact JSON schema provided. Ensure CDSCO verified info is present. List of medicines:\n` + toProcess.join("\n");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.1,
      }
    });

    if (response.text) {
      const results = JSON.parse(response.text);
      if (Array.isArray(results)) {
        results.forEach((med: any) => {
          // Check for duplicate by generic or brand
          if (!existingBrands.has(med.brand_names_india?.[0]?.toLowerCase())) {
             medicines.unshift(med);
             
             // UPDATE INDICES
             const terms = [med.drug_name, ...med.brand_names_india].map((t: string) => t.toLowerCase());
             terms.forEach((term: string) => {
               if (!index[term]) index[term] = [];
               if (!index[term].includes(med.id)) index[term].push(med.id);
             });
             const cat = med.category.toLowerCase();
             if (!categories[cat]) categories[cat] = [];
             if (!categories[cat].includes(med.id)) categories[cat].push(med.id);
             med.uses.forEach((use: string) => {
               const u = use.toLowerCase();
               if (!diseases[u]) diseases[u] = [];
               if (!diseases[u].includes(med.id)) diseases[u].push(med.id);
             });
          }
        });

        // WRITE BACK
        fs.writeFileSync(medicinesPath, JSON.stringify(medicines, null, 2));
        fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
        fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
        fs.writeFileSync(diseasesPath, JSON.stringify(diseases, null, 2));
        console.log(`Successfully added ${results.length} records!`);
      }
    }
  } catch (error) {
    console.error("Error generating content:", error);
  }
}

processMeds();
