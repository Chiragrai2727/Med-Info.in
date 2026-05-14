import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("No API key found in process.env.GEMINI_API_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// File Paths
const medicinesPath = path.join(process.cwd(), 'src/data/medicines.json');
const indexPath = path.join(process.cwd(), 'src/data/index.json');
const categoriesPath = path.join(process.cwd(), 'src/data/categories.json');
const diseasesPath = path.join(process.cwd(), 'src/data/diseases.json');

const responseSchema: Schema = {
  type: Type.ARRAY,
  items: {
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

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds to avoid rate limiting

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processBatch(batch: string[], medicinesMap: Map<string, string>, medicines: any[], index: any, categories: any, diseases: any) {
  console.log(`Processing batch of ${batch.length} medicines...`);
  const prompt = `Analyze these raw medicines crawled from a website (like Pharmeasy) and provide the detailed pharmacological data according to the exact JSON schema provided. Ensure CDSCO verified info is present in the output. If a medicine is banned or restricted by CDSCO, clearly state it in the india_regulatory_status field. List of medicines:\n` + batch.join("\n");
  
  try {
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
        let addedCount = 0;
        results.forEach((med: any) => {
          const medKey = med.brand_names_india?.[0]?.toLowerCase() || med.drug_name.toLowerCase();
          if (!medicinesMap.has(medKey)) {
             medicinesMap.set(medKey, med.id);
             medicines.unshift(med); // Append to top
             
             // Update indices
             const terms = [med.drug_name, ...(med.brand_names_india || [])].map((t: string) => t.toLowerCase());
             terms.forEach((term: string) => {
               if (!index[term]) index[term] = [];
               if (!index[term].includes(med.id)) index[term].push(med.id);
             });
             const cat = (med.category || '').toLowerCase();
             if (!categories[cat]) categories[cat] = [];
             if (!categories[cat].includes(med.id)) categories[cat].push(med.id);
             (med.uses || []).forEach((use: string) => {
               const u = use.toLowerCase();
               if (!diseases[u]) diseases[u] = [];
               if (!diseases[u].includes(med.id)) diseases[u].push(med.id);
             });
             addedCount++;
          }
        });

        // Write the incrementally updated data to not lose progress
        fs.writeFileSync(medicinesPath, JSON.stringify(medicines, null, 2));
        fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
        fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
        fs.writeFileSync(diseasesPath, JSON.stringify(diseases, null, 2));
        console.log(`Successfully appended ${addedCount} new records to verified datasets.`);
      }
    }
  } catch (error) {
    console.error("Error generating content for batch:", error);
  }
}

async function startImport(csvFilePath: string) {
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found at ${csvFilePath}`);
    process.exit(1);
  }

  // Load existing datasets to avoid duplicates
  let medicines = fs.existsSync(medicinesPath) ? JSON.parse(fs.readFileSync(medicinesPath, 'utf8')) : [];
  let index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : {};
  let categories = fs.existsSync(categoriesPath) ? JSON.parse(fs.readFileSync(categoriesPath, 'utf8')) : {};
  let diseases = fs.existsSync(diseasesPath) ? JSON.parse(fs.readFileSync(diseasesPath, 'utf8')) : {};

  const existingBrands = new Map<string, string>();
  for (const m of medicines) {
    if (m.brand_names_india) {
      m.brand_names_india.forEach((b: string) => existingBrands.set(b.toLowerCase(), m.id));
    }
    existingBrands.set(m.drug_name.toLowerCase(), m.id);
  }

  const newRecords: string[] = [];

  console.log(`Reading CSV file: ${csvFilePath}`);
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      // Assuming there's a column 'name' or 'drugName'. Adjust as needed based on the Pharmeasy CSV structure.
      const name = row.name || row.DrugName || row.medicine_name || Object.values(row)[0];
      if (name && typeof name === 'string') {
        newRecords.push(name);
      }
    })
    .on('end', async () => {
      console.log(`Total records found in CSV: ${newRecords.length}`);
      
      let batch: string[] = [];
      let processedGlobal = 0;
      for (const record of newRecords) {
        batch.push(record);
        if (batch.length >= BATCH_SIZE) {
          await processBatch(batch, existingBrands, medicines, index, categories, diseases);
          processedGlobal += batch.length;
          console.log(`Processed ${processedGlobal} / ${newRecords.length}`);
          batch = [];
          await delay(DELAY_BETWEEN_BATCHES); // Rate limit protection
        }
      }

      // Process any remaining records
      if (batch.length > 0) {
        await processBatch(batch, existingBrands, medicines, index, categories, diseases);
      }

      console.log("CSV import complete!");
      process.exit(0);
    });
}

const targetFile = process.argv[2];
if (!targetFile) {
  console.log("Usage: npm run import-csv <path-to-csv>");
  process.exit(1);
}

startImport(targetFile);
