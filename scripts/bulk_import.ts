import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseAppletConfig from '../firebase-applet-config.json' assert { type: 'json' };

// To run this: npx tsx scripts/bulk_import.ts

// Initialize Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: firebaseAppletConfig.projectId
    });
}

const db = getFirestore(firebaseAppletConfig.firestoreDatabaseId);
const CSV_FILE = 'medicines.csv';
const MEDICINES_JSON = './src/data/medicines.json';
const INDEX_JSON = './src/data/index.json';
const CATEGORIES_JSON = './src/data/categories.json';
const DISEASES_JSON = './src/data/diseases.json';

function cleanName(name: string) {
    return name
        .replace(/STRIP OF \d+ (TABLETS|CAPSULES|SOFTGEL CAPSULES|CHEWABLE TABLETS)/gi, '')
        .replace(/BOTTLE OF \d+(ML|GM) (EYE DROPS|SYRUP|POWDER|DROPS|GEL|OIL|INFUSION|LIQUID|ORAL DROPS)/gi, '')
        .replace(/TUBE OF \d+GM GEL/gi, '')
        .replace(/VIAL OF \d+ (SOLUTION|POWDER) FOR (INJECTION|INFUSION)/gi, '')
        .replace(/PRE FILLED (PEN|SYRINGE) OF \d+ML (SOLUTION FOR )?INJECTION/gi, '')
        .replace(/BOX OF \d+MD METERED DOSE INHALER/gi, '')
        .replace(/SACHET OF \d+GM (ORAL POWDER|GRANULES)/gi, '')
        .replace(/\s\d+(MG|MCG|IU|%|GM|ML).*$/gi, '')
        .trim();
}

async function bulkImport() {
    if (!fs.existsSync(CSV_FILE)) {
        console.error(`ERROR: "${CSV_FILE}" not found in root directory!`);
        console.log("Please upload your CSV file and ensure it is named exactly 'medicines.csv'.");
        return;
    }

    console.log("Reading existing local data...");
    const medicines = JSON.parse(fs.readFileSync(MEDICINES_JSON, 'utf8'));
    const existingIds = new Set(medicines.map(m => m.id));
    
    let processedCount = 0;
    let newMeds = [];
    let totalImported = 0;

    console.log("Starting CSV stream and cleaning labels...");

    const stream = fs.createReadStream(CSV_FILE).pipe(csv());

    for await (const row of stream) {
        const fullName = row['BrowseList_medicine__bz_e7'];
        const url = row['BrowseList_medicine__bz_e7 href'];

        if (!fullName || !url) continue;

        const brandName = cleanName(fullName);
        const id = brandName.toLowerCase().replace(/[^a-z0-9]/g, '_');

        if (!existingIds.has(id)) {
            newMeds.push({
                id,
                drug_name: brandName,
                pharmeasy_url: url,
                category: 'Pharmaceutical',
                brand_names_india: [brandName],
                quick_summary: `Verified pharmaceutical brand: ${brandName}. Automated import from PharmEasy.`,
                uses: ["Consult a physician."],
                side_effects_common: ["Depend on generic salt composition."],
                dosage_common: "As directed by physician.",
                india_regulatory_status: "Approved",
                source: "PharmEasy Export",
                createdBy: "SYSTEM_BULK_IMPORT",
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            existingIds.add(id);
        }

        processedCount++;
        if (processedCount % 1000 === 0) {
            console.log(`Parsed ${processedCount} rows... found ${newMeds.length} unique candidates.`);
        }
    }

    console.log(`\nParsing complete.`);
    console.log(`Total rows in CSV: ${processedCount}`);
    console.log(`Unique items to import: ${newMeds.length}`);

    if (newMeds.length === 0) {
        console.log("No new records to insert. All IDs matches existing entries.");
        return;
    }

    // 1. Update Firestore in batches of 500
    console.log("\nStarting Firestore bulk upload...");
    for (let i = 0; i < newMeds.length; i += 500) {
        const batch = db.batch();
        const chunk = newMeds.slice(i, i + 500);
        
        chunk.forEach(med => {
            const docRef = db.collection('medicines').doc(med.id);
            batch.set(docRef, med);
        });

        try {
            await batch.commit();
            totalImported += chunk.length;
            console.log(`[Firestore] Inserted ${totalImported}/${newMeds.length}...`);
        } catch (err) {
            console.error(`Batch failed at index ${i}:`, err.message);
        }
    }

    // 2. Update local JSON for immediate frontend reflection
    console.log("\nUpdating local JSON cache and rebuilding indices...");
    const medicinesReadyForLocal = newMeds.map(m => ({ ...m, createdAt: new Date().toISOString() }));
    const updatedMedicines = [...medicinesReadyForLocal, ...medicines];
    fs.writeFileSync(MEDICINES_JSON, JSON.stringify(updatedMedicines, null, 2));
    rebuildIndices(updatedMedicines);

    console.log("\nSUCCESS!");
    console.log(`- Inserted into Firebase: ${totalImported}`);
    console.log(`- Updated medicines.json: ${updatedMedicines.length} total records`);
}

function rebuildIndices(meds) {
    const diseasesIndex = {};
    const categoriesIndex = {};
    const searchIndex = {};

    meds.forEach(med => {
        searchIndex[med.id] = [med.drug_name, ...(med.brand_names_india || [])];
        const cat = (med.category || 'Pharmaceutical').toLowerCase();
        if (!categoriesIndex[cat]) categoriesIndex[cat] = [];
        if (!categoriesIndex[cat].includes(med.id)) categoriesIndex[cat].push(med.id);

        (med.uses || []).forEach(use => {
            const u = use.toLowerCase();
            if (!diseasesIndex[u]) diseasesIndex[u] = [];
            if (!diseasesIndex[u].includes(med.id)) diseasesIndex[u].push(med.id);
        });
    });

    fs.writeFileSync(DISEASES_JSON, JSON.stringify(diseasesIndex, null, 2));
    fs.writeFileSync(CATEGORIES_JSON, JSON.stringify(categoriesIndex, null, 2));
    fs.writeFileSync(INDEX_JSON, JSON.stringify(searchIndex, null, 2));
}

bulkImport().catch(console.error);
