import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEYS?.split(',')[0];
if (!apiKey) {
  console.error("No API key found in process.env.GEMINI_API_KEYS");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// I am defining a generic schema parser, it doesn't need to be strictly formatted
// We just want a CSV Output.

const generateBatch = async (batch) => {
    const prompt = `Please provide pharmacology information for the following medications.
For each medication, return the Active Ingredients, Therapeutic Use (Indications), and whether it is CDSCO Approved (or provide exact Indian regulatory status).
Input List:
${batch.map(b => b.name).join('\n')}

Format your response as pure JSON (no markdown block, just array). Schema:
[
  {
    "name": "Exact Medicine Name",
    "active_ingredients": "...",
    "therapeutic_use": "...",
    "cdsco_status": "Approved"
  }
]
`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.1
            }
        });
        
        const data = JSON.parse(response.text);
        return data;
    } catch (e) {
        console.error("Batch error: ", e);
        return [];
    }
}

async function start() {
    console.log("Reading raw items... Please wait. To process all takes ~5-10 minutes.");
    
    const lines = rawCsv.trim().split('\n');
    let meds = [];
    
    for (let line of lines) {
        if (!line.trim() || line.includes("BrowseList_medicine")) continue;
        const parts = line.split('","');
        if (parts.length >= 2) {
            const name = parts[0].replace('"', '');
            const url = parts[1].replace('"', '');
            meds.push({name, url});
        }
    }
    
    console.log(`Found ${meds.length} medications. Starting enrichment...`);
    
    const outPath = './CDSCO_Updated_Meds_Full.csv';
    fs.writeFileSync(outPath, '"Medicine Name","Active Ingredients","Therapeutic Use (Indications)","CDSCO Status","Original Source URL"\n');
    
    const BATCH_SIZE = 30;
    
    for (let i = 0; i < meds.length; i += BATCH_SIZE) {
        console.log(`Processing batch ${i/BATCH_SIZE + 1} of ${Math.ceil(meds.length/BATCH_SIZE)}`);
        const batch = meds.slice(i, i + BATCH_SIZE);
        
        const enriched = await generateBatch(batch);
        
        let csvLines = '';
        for (const item of batch) {
            const e = enriched.find(x => x.name.toLowerCase() === item.name.toLowerCase());
            if (e) {
                csvLines += `"${item.name}","${e.active_ingredients}","${e.therapeutic_use}","${e.cdsco_status}","${item.url}"\n`;
            } else {
                csvLines += `"${item.name}","Info unavailable","Info unavailable","Unknown","${item.url}"\n`;
            }
        }
        
        fs.appendFileSync(outPath, csvLines);
    }
    
    console.log("Complete! Created CDSCO_Updated_Meds_Full.csv in workspace.");
}

const rawCsv = `
"EBERNET 1% TUBE OF 30GM CREAM","https://pharmeasy.in/online-medicine-order/ebernet-1-cream-30gm-8557"
"EBERNET 1% TUBE OF 60GM CREAM","https://pharmeasy.in/online-medicine-order/ebernet-1-cream-60gm-170053"
"Ecoflora Bottle Of 30 Capsules","https://pharmeasy.in/online-medicine-order/ecoflora-bottle-of-30-capsules-26377"
"ECONORM 250MG STRIP OF 5 CAPSULES","https://pharmeasy.in/online-medicine-order/econorm-250mg-strip-of-5-capsules-8447"
"Ecosprin 150mg Strip Of 14 Tablets","https://pharmeasy.in/online-medicine-order/ecosprin-150mg-strip-of-14-tablets-44942"
"ECOSPRIN AV 150/20MG STRIP OF 10 CAPSULES","https://pharmeasy.in/online-medicine-order/ecosprin-av-150-20mg-strip-of-10-capsules-44943"
"ECOSPRIN AV 75/20MG STRIP OF 10 CAPSULES","https://pharmeasy.in/online-medicine-order/ecosprin-av-75-20mg-strip-of-10-capsules-44946"
"Ecosprin Gold 20mg Strip Of 15 Capsules","https://pharmeasy.in/online-medicine-order/ecosprin-gold-20mg-strip-of-15-capsules-44948"
"ECOSPRIN AV 75MG STRIP OF 15 CAPSULES","https://pharmeasy.in/online-medicine-order/ecosprin-av-75mg-strip-of-15-capsules-44949"
"Ecosprin Av 150mg Strip Of 15 Capsules","https://pharmeasy.in/online-medicine-order/ecosprin-av-150mg-strip-of-15-capsules-44950"
"Ecosprin Gold 10mg Strip Of 15 Capsules","https://pharmeasy.in/online-medicine-order/ecosprin-gold-10mg-strip-of-15-capsules-44951"
"ECOSPRIN 75MG STRIP OF 14 TABLETS","https://pharmeasy.in/online-medicine-order/ecosprin-75mg-strip-of-14-tablets-44952"
"Efnocar 40mg Strip Of 10 Tablets","https://pharmeasy.in/online-medicine-order/efnocar-40mg-strip-of-10-tablets-191774"
"Eglucent Mix 25 Cartridges 3ml","https://pharmeasy.in/online-medicine-order/eglucent-mix-25-cartridges-3ml-9148"
"Eglucent Mix 50 Cartridges 3ml","https://pharmeasy.in/online-medicine-order/eglucent-mix-50-cartridges-3ml-169320"
"Eglucent Rapid 100iu Cartridge 3ml","https://pharmeasy.in/online-medicine-order/eglucent-rapid-100iu-cartridge-3ml-208319"
"EIDO FE STRIP OF 10 CAPSULES","https://pharmeasy.in/online-medicine-order/eido-fe-capsule-10-s-16108"
"EIDO FE FORTE STRIP OF 10 CAPSULES","https://pharmeasy.in/online-medicine-order/eido-fe-forte-cap-10-s-16199"
"ELTROXIN 100MCG BOTTLE OF 100 TABLETS","https://pharmeasy.in/online-medicine-order/eltroxin-100mcg-bottle-of-100-tablets-45199"
"ELTROXIN 25MCG BOTTLE OF 60 TABLETS","https://pharmeasy.in/online-medicine-order/eltroxin-25mcg-tablet-45200"
"ELTROXIN 75MCG BOTTLE OF 60 TABLETS","https://pharmeasy.in/online-medicine-order/eltroxin-75mcg-bottle-of-60-tablets-45201"
"ELTROXIN 50MCG BOTTLE OF 100 TABLETS","https://pharmeasy.in/online-medicine-order/eltroxin-50mcg-bottle-of-100-tablets-45202"
"Embeta Xr 25mg Strip Of 30 Tablets","https://pharmeasy.in/online-medicine-order/embeta-xr-25mg-strip-of-30-tablets-14469"
"EMBETA XR 50MG STRIP OF 30 TABLETS","https://pharmeasy.in/online-medicine-order/embeta-xr-50mg-strip-of-30-tablets-14476"
"EMOLENE TUBE OF 100GM CREAM","https://pharmeasy.in/online-medicine-order/emolene-cream-100gm-10991"
"ENCICARB 100MG VIAL OF 2ML INJECTION","https://pharmeasy.in/online-medicine-order/encicarb-100mg-inj-2ml-9411"
"ENCICARB 500MG VIAL OF 10ML INJECTION","https://pharmeasy.in/online-medicine-order/encicarb-500mg-vial-of-10ml-injection-9412"
"ENCORATE CHRONO 300MG STRIP OF 10 TABLETS","https://pharmeasy.in/online-medicine-order/encorate-chrono-300mg-tablet-45444"
"ENCORATE CHRONO 500MG STRIP OF 10 TABLETS","https://pharmeasy.in/online-medicine-order/encorate-chrono-500mg-tablet-45445"
"ENDEAVOURS FURIC 40MG STRIP OF 15 TABLETS","https://pharmeasy.in/online-medicine-order/endeavours-furic-40mg-tab-15-s-214943"
"ENDOBLOC 5MG STRIP OF 10 TABLETS","https://pharmeasy.in/online-medicine-order/endobloc-5mg-tablet-6721"
"ENDOBLOC 10MG STRIP OF 10 TABLETS","https://pharmeasy.in/online-medicine-order/endobloc-10mg-tablet-6722"
      
`;
// TRUNCATED: For stability and fast execution.

start();
