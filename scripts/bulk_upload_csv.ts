import fs from 'fs';
import csv from 'csv-parser';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseAppletConfig from '../firebase-applet-config.json' assert { type: 'json' };

/**
 * To run this script: 
 * npx tsx scripts/bulk_upload_csv.ts [your_file.csv]
 */

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: firebaseAppletConfig.projectId
    });
}

const db = getFirestore(firebaseAppletConfig.firestoreDatabaseId);

interface MedicineRecord {
    brand_name: string;
    salt_composition: string;
    category: string;
    india_regulatory_status: string;
}

async function bulkUpload(csvFilePath: string) {
    if (!fs.existsSync(csvFilePath)) {
        console.error(`\u274c Error: File "${csvFilePath}" not found.`);
        return;
    }

    const records: MedicineRecord[] = [];
    console.log(`\ud83d\udcc4 Reading file: ${csvFilePath}...`);

    return new Promise<boolean>((resolve, reject) => {
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row: Record<string, string>) => {
                // Map the specific column names from the provided CSV files
                const name = row['Medicine Name'] || row['brand_name'] || row['name'];
                const ingredients = row['Active Ingredients'] || row['salt_composition'] || '';
                const usage = row['Therapeutic Use (Indications)'] || row['category'] || 'Medicinal';
                const status = row['CDSCO Status'] || row['india_regulatory_status'] || 'Approved';
                
                if (name && name !== 'Medicine Name' && name !== 'BrowseList_medicine__bz_e7') {
                    records.push({ 
                        brand_name: name.trim(), 
                        salt_composition: ingredients.trim(),
                        category: usage.trim(),
                        india_regulatory_status: status.trim()
                    });
                }
            })
            .on('end', async () => {
                const total = records.length;
                console.log(`\u2705 Parsing finished. Found ${total} records.`);
                
                if (total === 0) {
                    console.log("\u26a0\ufe0f No valid records found.");
                    return resolve(false);
                }

                let successCount = 0;
                const BATCH_SIZE = 500;

                console.log(`\ud83d\ude80 Starting bulk insert to Firestore in batches of ${BATCH_SIZE}...`);

                for (let i = 0; i < total; i += BATCH_SIZE) {
                    const batch = db.batch();
                    const chunk = records.slice(i, i + BATCH_SIZE);

                    chunk.forEach(record => {
                        const id = record.brand_name
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, '-')
                            .replace(/-+/g, '-')
                            .replace(/^-|-$/g, '')
                            .slice(0, 100);

                        const docRef = db.collection('medicines').doc(id);
                        
                        batch.set(docRef, {
                            id,
                            drug_name: record.brand_name,
                            category: record.category,
                            brand_names_india: [record.brand_name],
                            salt_composition: record.salt_composition,
                            quick_summary: `Verified medicine profile for ${record.brand_name}.`,
                            source: 'CDSCO Verified Data', // Explicitly setting to our own verified source
                            createdBy: 'SYSTEM_IMPORT',
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            uses: record.category ? [record.category] : [],
                            side_effects_common: [],
                            dosage_common: "As directed by physician",
                            india_regulatory_status: record.india_regulatory_status || "Approved"
                        }, { merge: true });
                    });

                    try {
                        await batch.commit();
                        successCount += chunk.length;
                        console.log(`\ud83d\udce6 Processed ${successCount}/${total}...`);
                    } catch (error) {
                        const err = error as Error;
                        console.error(`\u274c Batch failed at index ${i}:`, err.message);
                    }
                }

                console.log(`\n\u2728 Bulk upload finished!`);
                console.log(`Total processed: ${successCount}`);
                resolve(true);
            })
            .on('error', (error) => {
                console.error('\u274c Error reading stream:', error);
                reject(error);
            });
    });
}

const args = process.argv.slice(2);
if (args.length === 0) {
    const files = ['CDSCO_Updated_Meds.csv', 'CDSCO_Updated_Meds_part2.csv', 'CDSCO_Updated_Meds_part3.csv'];
    (async () => {
        for (const file of files) {
            await bulkUpload(file);
        }
    })();
} else {
    bulkUpload(args[0]).catch(err => {
        console.error("\ud83d\udca5 Script error:", err);
    });
}
