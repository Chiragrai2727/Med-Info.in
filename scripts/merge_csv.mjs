import fs from 'fs';
import path from 'path';

// This script reads the enriched CSV files and merges them into the application JSON store.

const csvFiles = [
    'CDSCO_Updated_Meds.csv',
    'CDSCO_Updated_Meds_part2.csv',
    'CDSCO_Updated_Meds_part3.csv'
];

const parseCSV = (content) => {
    const lines = content.split('\n');
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const matches = lines[i].match(/("([^"]|"")*")|([^,]+)/g);
        if (matches && matches.length >= 4) {
             result.push({
                 name: matches[0].replace(/"/g, ''),
                 active_ingredients: matches[1].replace(/"/g, ''),
                 therapeutic_use: matches[2].replace(/"/g, ''),
                 cdsco_status: matches[3].replace(/"/g, ''),
                 url: matches[4] ? matches[4].replace(/"/g, '') : ''
             });
        }
    }
    return result;
}

const medicinesPath = './src/data/medicines.json';
const indexPath = './src/data/index.json';
const categoriesPath = './src/data/categories.json';
const diseasesPath = './src/data/diseases.json';

const medicinesDb = JSON.parse(fs.readFileSync(medicinesPath, 'utf8'));
const indexDb = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const categoriesDb = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
const diseasesDb = JSON.parse(fs.readFileSync(diseasesPath, 'utf8'));

let allEnriched = [];

for (const f of csvFiles) {
    if (fs.existsSync(f)) {
        const content = fs.readFileSync(f, 'utf8');
        allEnriched = [...allEnriched, ...parseCSV(content)];
    }
}

console.log(`Loaded ${allEnriched.length} enriched records.`);

for (const entry of allEnriched) {
    const id = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Find index if exists
    const existingIndex = medicinesDb.findIndex(m => m.id === id);
    
    const medData = {
        id,
        drug_name: entry.name,
        category: "General",
        brand_names_india: [entry.name],
        drug_class: entry.therapeutic_use,
        mechanism_of_action: "Refer to active ingredients: " + entry.active_ingredients,
        uses: entry.therapeutic_use.split(',').map(s => s.trim()),
        dosage_common: "Consult your physician for dosage.",
        side_effects_common: ["Consult your physician for side effects."],
        side_effects_serious: ["Allergic reactions"],
        overdose_effects: "Seek immediate medical help in case of overdose.",
        contraindications: ["Known allergy to ingredients"],
        drug_interactions: ["Consult doctor"],
        pregnancy_safety: "Consult your doctor.",
        kidney_liver_warning: "Consult your doctor.",
        how_it_works_in_body:`Contains ${entry.active_ingredients} used for ${entry.therapeutic_use}.`,
        onset_of_action: "Varies",
        duration_of_effect: "Varies",
        prescription_required: true,
        ayurvedic_or_allopathic: "Allopathic",
        india_regulatory_status: entry.cdsco_status,
        quick_summary: `A CDSCO ${entry.cdsco_status} medication used for ${entry.therapeutic_use}.`,
        who_should_take: "Patients with " + entry.therapeutic_use,
        who_should_not_take: "Hypersensitive individuals",
        food_interactions: ["No specific food interactions"],
        alcohol_warning: "Avoid alcohol",
        source: "Verified Database",
        reference_url: entry.url
    };

    if (existingIndex === -1) {
        medicinesDb.push(medData);
    } else {
        // Merge - prioritize CDSCO info for overlapping fields
        medicinesDb[existingIndex] = {
            ...medicinesDb[existingIndex],
            ...medData,
            source: "Verified Database" // Mark as verified
        };
    }
    
    indexDb[id] = [entry.name];
    
    // ensure category exists
    const cat = "General".toLowerCase();
    if (!categoriesDb[cat]) categoriesDb[cat] = [];
    if (!categoriesDb[cat].includes(id)) {
        categoriesDb[cat].push(id);
    }
    
    // ensure disease exists
    const diseaseRaw = entry.therapeutic_use.split('/')[0].trim().toLowerCase();
    const dId = diseaseRaw || "general uses";
    if (!diseasesDb[dId]) {
        diseasesDb[dId] = [];
    }
    if (!diseasesDb[dId].includes(id)) {
        diseasesDb[dId].push(id);
    }
}

fs.writeFileSync(medicinesPath, JSON.stringify(medicinesDb, null, 2));
fs.writeFileSync(indexPath, JSON.stringify(indexDb, null, 2));
fs.writeFileSync(categoriesPath, JSON.stringify(categoriesDb, null, 2));
fs.writeFileSync(diseasesPath, JSON.stringify(diseasesDb, null, 2));

console.log("Successfully ingested newly formatted CSV items into src/data/");
