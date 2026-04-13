import fs from 'fs';

const newMedicines = [
  {
    "id": "pantoprazole_domperidone",
    "category": "Antacid & Antiemetic",
    "drug_name": "Pantoprazole + Domperidone",
    "brand_names_india": ["Pantocid DSR", "Pan-D", "Pantop-D", "Pensec DSR"],
    "drug_class": "Proton Pump Inhibitor & Dopamine Antagonist",
    "mechanism_of_action": "Pantoprazole reduces stomach acid. Domperidone increases movement of the stomach and intestines, allowing food to move more easily.",
    "uses": ["GERD (Acid reflux)", "Peptic ulcer disease", "Acidity", "Heartburn"],
    "dosage_common": "1 capsule once daily, 30 minutes before breakfast",
    "side_effects_common": ["Diarrhea", "Stomach pain", "Flatulence", "Dry mouth", "Headache"],
    "side_effects_serious": ["Bone fractures (long term use)", "Vitamin B12 deficiency", "Irregular heartbeat"],
    "overdose_effects": "Confusion, tremors, irregular heartbeat.",
    "contraindications": ["Severe liver disease", "Known allergy to PPIs"],
    "drug_interactions": ["Ketoconazole", "Digoxin", "Warfarin"],
    "pregnancy_safety": "Category C - Consult doctor before use.",
    "kidney_liver_warning": "Dose adjustment needed in severe liver disease.",
    "how_it_works_in_body": "Decreases the amount of acid produced in the stomach and prevents nausea/vomiting.",
    "onset_of_action": "30-60 minutes",
    "duration_of_effect": "24 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Commonly used for severe acidity, acid reflux, and heartburn.",
    "who_should_take": "Patients with GERD or chronic acidity.",
    "who_should_not_take": "Patients with severe liver impairment.",
    "food_interactions": ["Take on an empty stomach."],
    "alcohol_warning": "Avoid alcohol as it increases stomach acid and worsens symptoms."
  },
  {
    "id": "paracetamol_650",
    "category": "Analgesic & Antipyretic",
    "drug_name": "Paracetamol 650mg",
    "brand_names_india": ["Dolo 650", "Calpol 650", "Crocin 650", "P-650", "Macfast 650"],
    "drug_class": "Analgesic and Antipyretic",
    "mechanism_of_action": "Inhibits prostaglandin synthesis in the central nervous system to reduce pain and fever.",
    "uses": ["Fever", "Headache", "Body ache", "Mild to moderate pain"],
    "dosage_common": "1 tablet every 6-8 hours as needed (Max 4000mg/day)",
    "side_effects_common": ["Nausea", "Stomach upset", "Skin rash (rare)"],
    "side_effects_serious": ["Severe liver damage (in overdose)", "Allergic reactions"],
    "overdose_effects": "Liver failure, yellowing of eyes/skin, severe nausea, dark urine.",
    "contraindications": ["Severe liver disease", "Alcoholism"],
    "drug_interactions": ["Blood thinners (Warfarin)", "Ketoconazole", "Carbamazepine"],
    "pregnancy_safety": "Category B - Generally safe during pregnancy.",
    "kidney_liver_warning": "Use with extreme caution in liver disease.",
    "how_it_works_in_body": "Acts on the brain's temperature control center to lower fever and elevates the pain threshold.",
    "onset_of_action": "30-60 minutes",
    "duration_of_effect": "4-6 hours",
    "prescription_required": false,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "A widely used, safe medication for reducing fever and relieving mild pain.",
    "who_should_take": "People with fever, headache, or mild body aches.",
    "who_should_not_take": "People with severe liver disease.",
    "food_interactions": ["Can be taken with or without food."],
    "alcohol_warning": "Strictly avoid heavy alcohol use; significantly increases risk of liver damage."
  },
  {
    "id": "cetirizine_paracetamol_phenylephrine",
    "category": "Cold & Cough",
    "drug_name": "Cetirizine + Paracetamol + Phenylephrine",
    "brand_names_india": ["Cheston Cold", "Okacet Cold", "Sinarest", "Wikoryl", "Solvin Cold"],
    "drug_class": "Antihistamine, Analgesic, and Decongestant",
    "mechanism_of_action": "Cetirizine blocks histamine (allergy symptoms). Paracetamol reduces fever/pain. Phenylephrine narrows blood vessels to relieve nasal congestion.",
    "uses": ["Common cold", "Allergic rhinitis", "Nasal congestion", "Fever with cold"],
    "dosage_common": "1 tablet twice daily",
    "side_effects_common": ["Sleepiness", "Dry mouth", "Dizziness", "Nausea"],
    "side_effects_serious": ["High blood pressure", "Liver damage (rare)", "Severe allergic reactions"],
    "overdose_effects": "Severe drowsiness, rapid heartbeat, liver damage.",
    "contraindications": ["Severe hypertension", "Severe liver disease", "Glaucoma"],
    "drug_interactions": ["MAO inhibitors", "Antidepressants", "Other cold medicines"],
    "pregnancy_safety": "Category C - Avoid unless prescribed by a doctor.",
    "kidney_liver_warning": "Use with caution in liver and kidney disease.",
    "how_it_works_in_body": "Provides multi-symptom relief from cold, fever, and allergies.",
    "onset_of_action": "30-60 minutes",
    "duration_of_effect": "6-8 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Combination medicine used to treat common cold symptoms like blocked nose, runny nose, and fever.",
    "who_should_take": "Patients suffering from cold, flu, or severe nasal allergy symptoms.",
    "who_should_not_take": "Patients with high blood pressure or severe liver issues.",
    "food_interactions": ["Can be taken with or without food."],
    "alcohol_warning": "Avoid alcohol; increases drowsiness and risk of liver damage."
  },
  {
    "id": "azithromycin",
    "category": "Antibiotic",
    "drug_name": "Azithromycin",
    "brand_names_india": ["Azithral", "Azee", "Zithrox", "Azax", "ATM"],
    "drug_class": "Macrolide Antibiotic",
    "mechanism_of_action": "Stops bacterial growth by inhibiting their protein synthesis.",
    "uses": ["Throat infections", "Respiratory tract infections", "Ear infections", "Typhoid fever"],
    "dosage_common": "500mg once daily for 3-5 days",
    "side_effects_common": ["Nausea", "Vomiting", "Diarrhea", "Stomach pain"],
    "side_effects_serious": ["Irregular heartbeat (QT prolongation)", "Liver toxicity", "Severe allergic reactions"],
    "overdose_effects": "Severe nausea, vomiting, diarrhea, temporary hearing loss.",
    "contraindications": ["Known allergy to macrolides", "History of liver problems with this drug"],
    "drug_interactions": ["Antacids", "Digoxin", "Warfarin"],
    "pregnancy_safety": "Category B - Generally considered safe.",
    "kidney_liver_warning": "Use with caution in severe liver disease.",
    "how_it_works_in_body": "Prevents bacteria from multiplying, allowing the immune system to clear the infection.",
    "onset_of_action": "2-3 hours",
    "duration_of_effect": "24 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "A widely used antibiotic for throat, ear, and respiratory infections.",
    "who_should_take": "Patients with bacterial infections prescribed by a doctor.",
    "who_should_not_take": "Patients with a history of severe liver problems or irregular heartbeats.",
    "food_interactions": ["Take 1 hour before or 2 hours after meals (for some brands/forms), though many tablets can be taken with food."],
    "alcohol_warning": "Alcohol does not directly interact but can worsen side effects like dizziness and stomach upset."
  },
  {
    "id": "telmisartan",
    "category": "Antihypertensive",
    "drug_name": "Telmisartan",
    "brand_names_india": ["Telma", "Telmikind", "Tazloc", "Cresar", "Tsart"],
    "drug_class": "Angiotensin II Receptor Blocker (ARB)",
    "mechanism_of_action": "Blocks the action of angiotensin II, a chemical that tightens blood vessels, thereby relaxing them and lowering blood pressure.",
    "uses": ["Hypertension (High blood pressure)", "Heart attack prevention", "Stroke prevention"],
    "dosage_common": "40mg once daily",
    "side_effects_common": ["Back pain", "Sinus infection", "Diarrhea", "Dizziness"],
    "side_effects_serious": ["Kidney impairment", "High blood potassium levels", "Low blood pressure"],
    "overdose_effects": "Dizziness, fainting, fast or slow heartbeat.",
    "contraindications": ["Severe liver impairment", "Biliary obstructive disorders", "Pregnancy (2nd and 3rd trimesters)"],
    "drug_interactions": ["Lithium", "NSAIDs", "Potassium supplements", "Other blood pressure medicines"],
    "pregnancy_safety": "Category D - STRICTLY AVOID during pregnancy.",
    "kidney_liver_warning": "Use with caution in severe kidney or liver disease.",
    "how_it_works_in_body": "Relaxes blood vessels, allowing blood to flow more smoothly and the heart to pump more efficiently.",
    "onset_of_action": "1-2 hours",
    "duration_of_effect": "24 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "A widely prescribed medicine to lower high blood pressure and protect the heart.",
    "who_should_take": "Patients with high blood pressure or at high risk of cardiovascular events.",
    "who_should_not_take": "Pregnant women and patients with severe liver disease.",
    "food_interactions": ["Can be taken with or without food."],
    "alcohol_warning": "Avoid alcohol; it can excessively lower blood pressure and increase dizziness."
  }
];

const medicinesPath = './src/data/medicines.json';
const indexPath = './src/data/index.json';
const categoriesPath = './src/data/categories.json';
const diseasesPath = './src/data/diseases.json';

let medicines = JSON.parse(fs.readFileSync(medicinesPath, 'utf8'));
let index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
let categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
let diseases = JSON.parse(fs.readFileSync(diseasesPath, 'utf8'));

// Add new medicines to the beginning of the array
medicines = [...newMedicines, ...medicines];

newMedicines.forEach((med: any) => {
  // Update index.json
  const terms = [med.drug_name, ...med.brand_names_india].map((t: string) => t.toLowerCase());
  terms.forEach((term: string) => {
    if (!index[term]) index[term] = [];
    if (!index[term].includes(med.id)) index[term].push(med.id);
  });

  // Update categories.json
  const cat = med.category.toLowerCase();
  if (!categories[cat]) categories[cat] = [];
  if (!categories[cat].includes(med.id)) categories[cat].push(med.id);

  // Update diseases.json
  med.uses.forEach((use: string) => {
    const u = use.toLowerCase();
    if (!diseases[u]) diseases[u] = [];
    if (!diseases[u].includes(med.id)) diseases[u].push(med.id);
  });
});

fs.writeFileSync(medicinesPath, JSON.stringify(medicines, null, 2));
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
fs.writeFileSync(diseasesPath, JSON.stringify(diseases, null, 2));

console.log("Successfully updated datasets with batch 2.");
