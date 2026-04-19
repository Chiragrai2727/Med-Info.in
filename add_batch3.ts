import fs from 'fs';

const newMedicines = [
  {
    "id": "amoxicillin_clavulanic_acid",
    "category": "Antibiotic",
    "drug_name": "Amoxicillin + Clavulanic Acid",
    "brand_names_india": ["Augmentin 625", "Clavam 625", "Moxikind-CV", "Advent 625", "Bactoclav"],
    "drug_class": "Penicillin Antibiotic & Beta-lactamase Inhibitor",
    "mechanism_of_action": "Amoxicillin kills bacteria by inhibiting cell wall synthesis. Clavulanic acid prevents bacteria from destroying amoxicillin.",
    "uses": ["Ear infections", "Throat infections", "Urinary tract infections", "Skin infections", "Dental infections"],
    "dosage_common": "625mg twice daily for 5-7 days",
    "side_effects_common": ["Diarrhea", "Nausea", "Vomiting", "Skin rash"],
    "side_effects_serious": ["Severe allergic reaction (anaphylaxis)", "Liver damage", "Severe watery diarrhea (C. diff)"],
    "overdose_effects": "Severe stomach pain, vomiting, diarrhea, hyperactivity.",
    "contraindications": ["Penicillin allergy", "History of liver problems with this drug"],
    "drug_interactions": ["Allopurinol", "Oral contraceptives", "Probenecid"],
    "pregnancy_safety": "Category B - Generally considered safe if prescribed.",
    "kidney_liver_warning": "Dose adjustment required in severe kidney disease.",
    "how_it_works_in_body": "Works as a shield to protect amoxicillin, allowing it to successfully break down bacterial walls.",
    "onset_of_action": "1-2 hours",
    "duration_of_effect": "8-12 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "A powerful broad-spectrum antibiotic used for a wide variety of bacterial infections.",
    "who_should_take": "Patients with bacterial infections prescribed by a doctor.",
    "who_should_not_take": "People allergic to penicillin.",
    "food_interactions": ["Take at the start of a meal to improve absorption and reduce stomach upset."],
    "alcohol_warning": "Avoid alcohol; may increase dizziness and stomach upset."
  },
  {
    "id": "metformin_500",
    "category": "Antidiabetic",
    "drug_name": "Metformin 500mg",
    "brand_names_india": ["Glycomet", "Okamet", "Zomet", "Cetapin", "Riomet"],
    "drug_class": "Biguanide Antidiabetic",
    "mechanism_of_action": "Decreases glucose production in the liver and improves insulin sensitivity in body tissues.",
    "uses": ["Type 2 Diabetes Mellitus", "PCOS (Polycystic Ovary Syndrome)"],
    "dosage_common": "500mg once or twice daily with meals",
    "side_effects_common": ["Nausea", "Diarrhea", "Stomach ache", "Loss of appetite", "Metallic taste"],
    "side_effects_serious": ["Lactic acidosis (rare but serious)", "Vitamin B12 deficiency", "Low blood sugar (if combined)"],
    "overdose_effects": "Severe lactic acidosis, weakness, slow heart rate, muscle pain.",
    "contraindications": ["Severe kidney disease", "Metabolic acidosis", "Diabetic ketoacidosis"],
    "drug_interactions": ["Iodinated contrast media", "Alcohol", "Cimetidine"],
    "pregnancy_safety": "Category B - Considered safe, but insulin is often preferred.",
    "kidney_liver_warning": "Strictly contraindicated in severe kidney impairment.",
    "how_it_works_in_body": "Helps your body make better use of the insulin it naturally produces.",
    "onset_of_action": "Within 2 days (full effect in 1-2 weeks)",
    "duration_of_effect": "12-24 hours depending on the formulation (SR/ER)",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "The first-line medication for managing Type 2 Diabetes.",
    "who_should_take": "Patients diagnosed with Type 2 Diabetes or PCOS.",
    "who_should_not_take": "Patients with severe kidney disease.",
    "food_interactions": ["Must be taken with or immediately after food to prevent severe stomach upset."],
    "alcohol_warning": "Avoid excessive alcohol due to increased risk of lactic acidosis."
  },
  {
    "id": "atorvastatin_10",
    "category": "Statins (Cholesterol Lowering)",
    "drug_name": "Atorvastatin 10mg",
    "brand_names_india": ["Atorva", "Lipikind", "Aztor", "Storvas", "Tonact"],
    "drug_class": "HMG-CoA Reductase Inhibitor",
    "mechanism_of_action": "Blocks the enzyme in the liver responsible for making cholesterol, thereby lowering bad cholesterol (LDL) and raising good cholesterol (HDL).",
    "uses": ["High cholesterol", "Prevention of heart attack", "Prevention of stroke"],
    "dosage_common": "10-20mg once daily, preferably at night",
    "side_effects_common": ["Muscle aches", "Joint pain", "Upset stomach", "Headache"],
    "side_effects_serious": ["Severe muscle breakdown (rhabdomyolysis)", "Liver damage", "Increased blood sugar"],
    "overdose_effects": "Muscle pain, weakness, digestive issues.",
    "contraindications": ["Active liver disease", "Pregnancy and breastfeeding"],
    "drug_interactions": ["Clarithromycin", "Itraconazole", "Grapefruit juice", "Gemfibrozil"],
    "pregnancy_safety": "Category X - STRICTLY AVOID during pregnancy.",
    "kidney_liver_warning": "Contraindicated in active liver disease.",
    "how_it_works_in_body": "Forces the liver to clear LDL (bad cholesterol) from the blood by stopping its internal production.",
    "onset_of_action": "3-5 days (Max effect in 2-4 weeks)",
    "duration_of_effect": "24 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Highly effective widely-used med to lower cholesterol and prevent heart disease.",
    "who_should_take": "Patients with high cholesterol or high cardiovascular risk.",
    "who_should_not_take": "Pregnant women and individuals with liver disease.",
    "food_interactions": ["Avoid grapefruit and grapefruit juice as it increases drug levels in blood."],
    "alcohol_warning": "Limit alcohol; heavy consumption increases the risk of liver damage."
  },
  {
    "id": "levothyroxine_50",
    "category": "Thyroid Hormone",
    "drug_name": "Levothyroxine 50mcg",
    "brand_names_india": ["Thyronorm", "Eltroxin", "Thyrox", "Lethrox"],
    "drug_class": "Thyroid Hormone Replacement",
    "mechanism_of_action": "Replaces the missing thyroxine hormone that the thyroid gland would naturally produce.",
    "uses": ["Hypothyroidism (Underactive thyroid)", "Goiter"],
    "dosage_common": "50mcg once daily on an empty stomach in the morning",
    "side_effects_common": ["Weight loss", "Increased appetite", "Tremors", "Headache", "Insomnia"],
    "side_effects_serious": ["Heart palpitations", "Chest pain", "Shortness of breath", "Bone loss (long term)"],
    "overdose_effects": "Fast heartbeat, fever, sweating, confusion, nervousness.",
    "contraindications": ["Untreated adrenal insufficiency", "Recent heart attack"],
    "drug_interactions": ["Calcium supplements", "Iron supplements", "Antacids", "Diabetes medications"],
    "pregnancy_safety": "Category A - Safe and necessary to continue during pregnancy.",
    "kidney_liver_warning": "Safe, but requires regular blood monitoring.",
    "how_it_works_in_body": "Restores normal metabolic rates and energy levels in the body.",
    "onset_of_action": "Several days to weeks",
    "duration_of_effect": "Half-life is 6-7 days",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Essential replacement therapy for underactive thyroid issues.",
    "who_should_take": "Patients diagnosed with hypothyroidism.",
    "who_should_not_take": "Patients with untreated adrenal gland problems or recent heart attack.",
    "food_interactions": ["Must be taken on a strictly empty stomach, 30-60 minutes before breakfast. Avoid eating walnuts, soybean flour, or high dietary fiber immediately after."],
    "alcohol_warning": "Mild alcohol use is fine, but it can affect medication absorption."
  },
  {
    "id": "montelukast_levocetirizine",
    "category": "Allergy & Asthma",
    "drug_name": "Montelukast + Levocetirizine",
    "brand_names_india": ["Montair LC", "Montelekast LC", "Telekast L", "Levomac M", "Romilast L"],
    "drug_class": "Leukotriene Receptor Antagonist & Antihistamine",
    "mechanism_of_action": "Montelukast blocks leukotrienes (chemicals that cause airway inflammation). Levocetirizine blocks histamine (chemical causing allergy symptoms).",
    "uses": ["Allergic rhinitis", "Asthma", "Sneezing and runny nose", "Hay fever"],
    "dosage_common": "1 tablet once daily, preferably at night",
    "side_effects_common": ["Sleepiness", "Dry mouth", "Headache", "Fatigue", "Mild stomach pain"],
    "side_effects_serious": ["Mood changes", "Agitation", "Depression", "Suicidal thoughts (very rare)"],
    "overdose_effects": "Severe drowsiness, abdominal pain, restlessness.",
    "contraindications": ["Severe kidney impairment", "Hepatic impairment"],
    "drug_interactions": ["Phenobarbital", "Phenytoin", "Rifampin", "CNS depressants"],
    "pregnancy_safety": "Category B/C - Consult doctor before use.",
    "kidney_liver_warning": "Not recommended in severe kidney failure.",
    "how_it_works_in_body": "Opens up the airways and prevents the immune system's hyper-reaction to allergens.",
    "onset_of_action": "1-2 hours",
    "duration_of_effect": "24 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "A highly effective combination for treating chronic allergies, asthma, and severe runny nose.",
    "who_should_take": "Patients with persistent allergies or concurrent asthma.",
    "who_should_not_take": "Patients with severe kidney disease.",
    "food_interactions": ["Can be taken with or without food."],
    "alcohol_warning": "Avoid completely; heavily increases drowsiness and dizziness."
  },
  {
    "id": "diclofenac_sodium",
    "category": "Painkiller",
    "drug_name": "Diclofenac Sodium",
    "brand_names_india": ["Voveran", "Reactin", "Dicloran", "Diclotal"],
    "drug_class": "NSAID (Non-Steroidal Anti-Inflammatory Drug)",
    "mechanism_of_action": "Inhibits COX-1 and COX-2 enzymes, stopping the production of prostaglandins which cause pain and inflammation.",
    "uses": ["Joint pain", "Muscle pain", "Arthritis", "Backache", "Post-operative pain"],
    "dosage_common": "50mg twice or thrice daily after meals",
    "side_effects_common": ["Stomach upset", "Nausea", "Heartburn", "Dizziness"],
    "side_effects_serious": ["Stomach bleeding", "Ulcers", "Kidney failure", "Heart attack/Stroke risk"],
    "overdose_effects": "Lethargy, stomach pain, vomiting blood, shallow breathing.",
    "contraindications": ["Asthma", "Active stomach ulcers", "Severe heart failure", "3rd trimester of pregnancy"],
    "drug_interactions": ["Blood thinners", "Other NSAIDs", "Lithium", "Blood pressure medicines"],
    "pregnancy_safety": "Category C (D in 3rd trimester) - Avoid, especially later in pregnancy.",
    "kidney_liver_warning": "Avoid in severe kidney disease. Use with caution in liver disease.",
    "how_it_works_in_body": "Provides strong relief from swelling, stiffness, and severe pain.",
    "onset_of_action": "30-60 minutes",
    "duration_of_effect": "6-8 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "A strong painkiller and anti-inflammatory used for joint and severe muscle issues.",
    "who_should_take": "People suffering from arthritis, sports injuries, or intense muscle aches.",
    "who_should_not_take": "Patients with stomach ulcers, asthma, or kidney disease.",
    "food_interactions": ["Always take with food or milk to prevent stomach ulcers and bleeding."],
    "alcohol_warning": "Strictly avoid; hugely increases the risk of fatal stomach bleeding."
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

// Filter out duplicates if already added
const existingIds = new Set(medicines.map((m: any) => m.id));
const medsToAdd = newMedicines.filter(m => !existingIds.has(m.id));

if (medsToAdd.length > 0) {
  medicines = [...medsToAdd, ...medicines];

  medsToAdd.forEach((med: any) => {
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
  });

  fs.writeFileSync(medicinesPath, JSON.stringify(medicines, null, 2));
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
  fs.writeFileSync(diseasesPath, JSON.stringify(diseases, null, 2));

  console.log(`Successfully added ${medsToAdd.length} new medicines in batch 3.`);
} else {
  console.log("No new medicines to add. All IDs already exist.");
}
