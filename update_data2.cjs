const fs = require('fs');

const medicines = JSON.parse(fs.readFileSync('src/data/medicines.json', 'utf8'));

const newMedicines = [
  {
    "id": "enalapril",
    "category": "Anti-hypertensive drugs",
    "drug_name": "Enalapril",
    "brand_names_india": ["Envas", "Nuril", "BQL"],
    "drug_class": "ACE Inhibitor",
    "mechanism_of_action": "Inhibits angiotensin-converting enzyme, preventing the formation of angiotensin II",
    "uses": ["Hypertension", "Heart failure", "Diabetic nephropathy"],
    "dosage_common": "5mg to 20mg once or twice daily",
    "side_effects_common": ["Dry cough", "Dizziness", "Fatigue"],
    "side_effects_serious": ["Angioedema", "Hyperkalemia", "Kidney impairment"],
    "overdose_effects": "Severe hypotension, stupor",
    "contraindications": ["History of angioedema", "Pregnancy"],
    "drug_interactions": ["Potassium supplements", "NSAIDs", "Lithium"],
    "pregnancy_safety": "Category D - Avoid during pregnancy",
    "kidney_liver_warning": "Dose adjustment required in kidney impairment",
    "how_it_works_in_body": "Relaxes blood vessels, lowering blood pressure and reducing the heart's workload.",
    "onset_of_action": "1 hour",
    "duration_of_effect": "24 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Effective blood pressure medication that also protects the heart and kidneys.",
    "who_should_take": "Patients with high blood pressure or heart failure.",
    "who_should_not_take": "Pregnant women or those with a history of angioedema.",
    "food_interactions": [],
    "alcohol_warning": "May increase the blood pressure-lowering effect, causing dizziness."
  },
  {
    "id": "metoprolol",
    "category": "Anti-hypertensive drugs",
    "drug_name": "Metoprolol",
    "brand_names_india": ["Metolar", "Seloken", "Starpress"],
    "drug_class": "Beta-blocker",
    "mechanism_of_action": "Cardioselective beta-1 adrenergic receptor antagonist",
    "uses": ["Hypertension", "Angina", "Heart failure", "Arrhythmia"],
    "dosage_common": "25mg to 100mg daily",
    "side_effects_common": ["Fatigue", "Dizziness", "Cold hands and feet"],
    "side_effects_serious": ["Bradycardia", "Heart block", "Bronchospasm"],
    "overdose_effects": "Severe bradycardia, hypotension, heart failure",
    "contraindications": ["Severe bradycardia", "Second or third-degree heart block", "Cardiogenic shock"],
    "drug_interactions": ["Calcium channel blockers", "Digoxin", "Clonidine"],
    "pregnancy_safety": "Category C - Use with caution",
    "kidney_liver_warning": "Use with caution in severe liver impairment",
    "how_it_works_in_body": "Slows the heart rate and reduces the force of heart muscle contraction.",
    "onset_of_action": "1-2 hours",
    "duration_of_effect": "12-24 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Heart medication used to treat high blood pressure, chest pain, and heart failure.",
    "who_should_take": "Patients with cardiovascular conditions requiring heart rate control.",
    "who_should_not_take": "People with very slow heart rate or severe heart block.",
    "food_interactions": ["Take with or immediately after meals"],
    "alcohol_warning": "May increase drowsiness and dizziness."
  },
  {
    "id": "pioglitazone",
    "category": "Anti-diabetic drugs",
    "drug_name": "Pioglitazone",
    "brand_names_india": ["Pioz", "Piomed", "Pioglit"],
    "drug_class": "Thiazolidinedione",
    "mechanism_of_action": "Increases insulin sensitivity in muscle and adipose tissue",
    "uses": ["Type 2 Diabetes Mellitus", "Diabetes"],
    "dosage_common": "15mg to 30mg once daily",
    "side_effects_common": ["Weight gain", "Edema", "Upper respiratory tract infection"],
    "side_effects_serious": ["Heart failure", "Bone fractures", "Bladder cancer risk"],
    "overdose_effects": "Hypoglycemia (if taken with other anti-diabetics)",
    "contraindications": ["Heart failure (NYHA Class III or IV)", "Active bladder cancer"],
    "drug_interactions": ["Gemfibrozil", "Rifampin", "Insulin"],
    "pregnancy_safety": "Category C - Use with caution",
    "kidney_liver_warning": "Avoid in active liver disease",
    "how_it_works_in_body": "Helps the body use insulin more effectively to lower blood sugar.",
    "onset_of_action": "Delayed (weeks for full effect)",
    "duration_of_effect": "24 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Improves insulin sensitivity to help control blood sugar in Type 2 Diabetes.",
    "who_should_take": "Patients with Type 2 Diabetes needing better glycemic control.",
    "who_should_not_take": "Individuals with severe heart failure or active bladder cancer.",
    "food_interactions": [],
    "alcohol_warning": "May increase the risk of hypoglycemia."
  },
  {
    "id": "gliclazide",
    "category": "Anti-diabetic drugs",
    "drug_name": "Gliclazide",
    "brand_names_india": ["Diamicron", "Glycigon", "Reclimet"],
    "drug_class": "Sulfonylurea",
    "mechanism_of_action": "Stimulates insulin secretion from pancreatic beta cells",
    "uses": ["Type 2 Diabetes Mellitus", "Diabetes"],
    "dosage_common": "40mg to 80mg daily, usually with breakfast",
    "side_effects_common": ["Hypoglycemia", "Weight gain", "Nausea"],
    "side_effects_serious": ["Severe hypoglycemia", "Liver toxicity", "Blood disorders"],
    "overdose_effects": "Severe hypoglycemia, coma, seizures",
    "contraindications": ["Type 1 Diabetes", "Diabetic ketoacidosis", "Severe kidney/liver impairment"],
    "drug_interactions": ["Miconazole", "Phenylbutazone", "Beta-blockers"],
    "pregnancy_safety": "Category C - Generally avoided",
    "kidney_liver_warning": "Avoid in severe kidney or liver impairment",
    "how_it_works_in_body": "Forces the pancreas to release more insulin to lower blood sugar levels.",
    "onset_of_action": "1-2 hours",
    "duration_of_effect": "12-24 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Oral medication that stimulates the pancreas to produce more insulin.",
    "who_should_take": "Patients with Type 2 Diabetes whose pancreas still produces some insulin.",
    "who_should_not_take": "Patients with Type 1 Diabetes or severe kidney/liver disease.",
    "food_interactions": ["Take with meals to prevent low blood sugar"],
    "alcohol_warning": "Can cause severe hypoglycemia and a disulfiram-like reaction."
  },
  {
    "id": "doxycycline",
    "category": "Antibiotic",
    "drug_name": "Doxycycline",
    "brand_names_india": ["Doxicip", "Tetradox", "Minicycline"],
    "drug_class": "Tetracycline Antibiotic",
    "mechanism_of_action": "Inhibits bacterial protein synthesis by binding to the 30S ribosomal subunit",
    "uses": ["Infections", "Acne", "Malaria prophylaxis", "Respiratory tract infections"],
    "dosage_common": "100mg twice daily",
    "side_effects_common": ["Nausea", "Vomiting", "Photosensitivity (sunburn easily)"],
    "side_effects_serious": ["Esophageal ulceration", "Hepatotoxicity", "Intracranial hypertension"],
    "overdose_effects": "Nausea, vomiting, diarrhea",
    "contraindications": ["Pregnancy", "Children under 8 years (causes tooth discoloration)"],
    "drug_interactions": ["Antacids", "Iron supplements", "Oral contraceptives"],
    "pregnancy_safety": "Category D - Avoid during pregnancy",
    "kidney_liver_warning": "Use with caution in liver impairment",
    "how_it_works_in_body": "Stops the growth and spread of bacteria.",
    "onset_of_action": "1-2 hours",
    "duration_of_effect": "12-24 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Broad-spectrum antibiotic used for various bacterial infections and acne.",
    "who_should_take": "Patients with susceptible bacterial infections or severe acne.",
    "who_should_not_take": "Pregnant women and young children.",
    "food_interactions": ["Avoid dairy products, antacids, and iron supplements within 2 hours of taking"],
    "alcohol_warning": "May decrease the effectiveness of the antibiotic."
  }
];

newMedicines.forEach(newMed => {
  if (!medicines.find(m => m.id === newMed.id)) {
    medicines.push(newMed);
  }
});

fs.writeFileSync('src/data/medicines.json', JSON.stringify(medicines, null, 2));

const diseasesIndex = {};
const categoriesIndex = {};

medicines.forEach(med => {
  med.uses.forEach(use => {
    const useLower = use.toLowerCase();
    if (!diseasesIndex[useLower]) {
      diseasesIndex[useLower] = [];
    }
    if (!diseasesIndex[useLower].includes(med.id)) {
      diseasesIndex[useLower].push(med.id);
    }
    
    const words = useLower.split(/[\s,()]+/);
    words.forEach(word => {
      if (word.length > 3) {
        if (!diseasesIndex[word]) diseasesIndex[word] = [];
        if (!diseasesIndex[word].includes(med.id)) diseasesIndex[word].push(med.id);
      }
    });
  });

  const catLower = med.category.toLowerCase();
  if (!categoriesIndex[catLower]) {
    categoriesIndex[catLower] = [];
  }
  if (!categoriesIndex[catLower].includes(med.id)) {
    categoriesIndex[catLower].push(med.id);
  }
});

fs.writeFileSync('src/data/diseases.json', JSON.stringify(diseasesIndex, null, 2));
fs.writeFileSync('src/data/categories.json', JSON.stringify(categoriesIndex, null, 2));

console.log('Successfully updated medicines, diseases, and categories with batch 2.');
