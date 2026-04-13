const fs = require('fs');

const medicines = JSON.parse(fs.readFileSync('src/data/medicines.json', 'utf8'));

const newMedicines = [
  {
    "id": "levocetirizine",
    "category": "Antihistamine",
    "drug_name": "Levocetirizine",
    "brand_names_india": ["Levocet", "1-AL", "Teczine"],
    "drug_class": "Third-generation non-sedating antihistamine",
    "mechanism_of_action": "Blocks histamine H1 receptors, preventing allergic responses",
    "uses": ["Allergies", "Cold & Cough", "Hay fever", "Hives"],
    "dosage_common": "5mg once daily",
    "side_effects_common": ["Sleepiness", "Dry mouth", "Fatigue"],
    "side_effects_serious": ["Urinary retention", "Severe allergic reactions"],
    "overdose_effects": "Severe drowsiness, agitation",
    "contraindications": ["Severe kidney impairment"],
    "drug_interactions": ["CNS depressants", "Alcohol", "Ritonavir"],
    "pregnancy_safety": "Category B - Generally considered safe",
    "kidney_liver_warning": "Dose adjustment required in kidney impairment",
    "how_it_works_in_body": "Prevents histamine from binding to its receptors, reducing allergy symptoms.",
    "onset_of_action": "1 hour",
    "duration_of_effect": "24 hours",
    "prescription_required": false,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Non-drowsy antihistamine for quick relief from allergies and cold symptoms.",
    "who_should_take": "Individuals suffering from allergic rhinitis or chronic urticaria.",
    "who_should_not_take": "Patients with end-stage renal disease.",
    "food_interactions": [],
    "alcohol_warning": "May increase drowsiness; avoid concurrent use."
  },
  {
    "id": "mefenamic_acid",
    "category": "Analgesic",
    "drug_name": "Mefenamic Acid",
    "brand_names_india": ["Meftal", "Ponstan"],
    "drug_class": "NSAID",
    "mechanism_of_action": "Inhibits cyclooxygenase (COX) enzymes, reducing prostaglandin synthesis",
    "uses": ["Fever", "Menstrual cramps", "Mild to moderate pain", "Headache"],
    "dosage_common": "250mg to 500mg three times a day",
    "side_effects_common": ["Stomach upset", "Nausea", "Dizziness"],
    "side_effects_serious": ["GI bleeding", "Kidney damage", "Cardiovascular events"],
    "overdose_effects": "Lethargy, drowsiness, nausea, vomiting, epigastric pain",
    "contraindications": ["Active peptic ulcer", "Severe heart failure", "Third trimester of pregnancy"],
    "drug_interactions": ["Anticoagulants", "Other NSAIDs", "Lithium"],
    "pregnancy_safety": "Category C (Category D in 3rd trimester)",
    "kidney_liver_warning": "Use with caution in kidney or liver impairment",
    "how_it_works_in_body": "Reduces inflammation and pain by blocking the production of prostaglandins.",
    "onset_of_action": "30-60 minutes",
    "duration_of_effect": "6 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Effective pain reliever, especially for menstrual cramps and fever.",
    "who_should_take": "People with dysmenorrhea, fever, or mild to moderate pain.",
    "who_should_not_take": "Patients with a history of GI bleeding or severe kidney disease.",
    "food_interactions": ["Take with food or milk to reduce stomach upset"],
    "alcohol_warning": "Increases the risk of stomach bleeding."
  },
  {
    "id": "montelukast",
    "category": "Anti-asthmatic",
    "drug_name": "Montelukast",
    "brand_names_india": ["Montair", "Telekast", "Romilast"],
    "drug_class": "Leukotriene Receptor Antagonist",
    "mechanism_of_action": "Blocks the action of leukotrienes, reducing inflammation and bronchoconstriction",
    "uses": ["Asthma", "Allergies", "Cold & Cough"],
    "dosage_common": "10mg once daily in the evening",
    "side_effects_common": ["Headache", "Stomach pain", "Diarrhea"],
    "side_effects_serious": ["Neuropsychiatric events (agitation, depression, suicidal thoughts)"],
    "overdose_effects": "Abdominal pain, somnolence, thirst, headache, vomiting",
    "contraindications": ["Hypersensitivity"],
    "drug_interactions": ["Phenytoin", "Phenobarbital", "Rifampin"],
    "pregnancy_safety": "Category B - Generally considered safe",
    "kidney_liver_warning": "Use with caution in severe liver impairment",
    "how_it_works_in_body": "Prevents leukotrienes from causing swelling and tightening of airways.",
    "onset_of_action": "3-4 hours",
    "duration_of_effect": "24 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Prevents asthma attacks and relieves severe allergy symptoms.",
    "who_should_take": "Patients with asthma or seasonal allergic rhinitis.",
    "who_should_not_take": "People with a history of severe neuropsychiatric symptoms.",
    "food_interactions": [],
    "alcohol_warning": "Safe, but alcohol may worsen underlying asthma/allergy symptoms."
  },
  {
    "id": "rabeprazole",
    "category": "Antacid",
    "drug_name": "Rabeprazole",
    "brand_names_india": ["Rablet", "Rabicip", "Veloz"],
    "drug_class": "Proton Pump Inhibitor (PPI)",
    "mechanism_of_action": "Irreversibly binds to the gastric proton pump, blocking gastric acid secretion",
    "uses": ["Acidity", "GERD", "Peptic ulcer disease"],
    "dosage_common": "20mg once daily before breakfast",
    "side_effects_common": ["Headache", "Diarrhea", "Nausea"],
    "side_effects_serious": ["Clostridium difficile-associated diarrhea", "Bone fractures (long-term use)", "Hypomagnesemia"],
    "overdose_effects": "No specific symptoms, general supportive care needed",
    "contraindications": ["Hypersensitivity to rabeprazole or other PPIs"],
    "drug_interactions": ["Digoxin", "Ketoconazole", "Warfarin"],
    "pregnancy_safety": "Category B - Generally considered safe",
    "kidney_liver_warning": "Use with caution in severe liver impairment",
    "how_it_works_in_body": "Reduces the amount of acid produced in the stomach, allowing ulcers to heal.",
    "onset_of_action": "1 hour",
    "duration_of_effect": "24 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Strong acid reducer for GERD, ulcers, and severe acidity.",
    "who_should_take": "Patients with acid reflux, GERD, or stomach ulcers.",
    "who_should_not_take": "People with known hypersensitivity to PPIs.",
    "food_interactions": ["Take 30 minutes before a meal for maximum effectiveness"],
    "alcohol_warning": "Alcohol can irritate the stomach lining, worsening acidity."
  },
  {
    "id": "dextromethorphan",
    "category": "Antitussive",
    "drug_name": "Dextromethorphan",
    "brand_names_india": ["Benadryl DR", "Alex", "Ascoril D"],
    "drug_class": "Cough Suppressant",
    "mechanism_of_action": "Acts on the cough center in the medulla to elevate the threshold for coughing",
    "uses": ["Cold & Cough", "Dry cough"],
    "dosage_common": "10-20mg every 4 hours or 30mg every 6-8 hours",
    "side_effects_common": ["Dizziness", "Lightheadedness", "Drowsiness"],
    "side_effects_serious": ["Serotonin syndrome (if used with MAOIs)", "Respiratory depression (in overdose)"],
    "overdose_effects": "Nausea, vomiting, stupor, coma, respiratory depression",
    "contraindications": ["Concurrent use of MAOIs", "Asthma (can impair expectoration)"],
    "drug_interactions": ["MAOIs", "SSRIs", "CNS depressants"],
    "pregnancy_safety": "Category C - Use if potential benefit justifies the risk",
    "kidney_liver_warning": "Use with caution in liver impairment",
    "how_it_works_in_body": "Suppresses the urge to cough by acting on the brain.",
    "onset_of_action": "15-30 minutes",
    "duration_of_effect": "3-6 hours",
    "prescription_required": false,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Effective cough suppressant for dry, non-productive coughs.",
    "who_should_take": "Individuals suffering from a dry, hacking cough.",
    "who_should_not_take": "Patients with a productive (wet) cough or taking MAOIs.",
    "food_interactions": [],
    "alcohol_warning": "Avoid alcohol as it significantly increases CNS depression."
  },
  {
    "id": "naproxen",
    "category": "Analgesic",
    "drug_name": "Naproxen",
    "brand_names_india": ["Naprosyn", "Xenobid", "Naxdom"],
    "drug_class": "NSAID",
    "mechanism_of_action": "Non-selective inhibitor of cyclooxygenase (COX-1 and COX-2)",
    "uses": ["Headache", "Fever", "Arthritis", "Muscle pain"],
    "dosage_common": "250mg to 500mg twice daily",
    "side_effects_common": ["Indigestion", "Heartburn", "Stomach pain"],
    "side_effects_serious": ["GI bleeding", "Cardiovascular events", "Kidney failure"],
    "overdose_effects": "Lethargy, drowsiness, nausea, vomiting, epigastric pain",
    "contraindications": ["Active peptic ulcer", "Severe heart failure", "History of asthma triggered by NSAIDs"],
    "drug_interactions": ["Anticoagulants", "ACE inhibitors", "Lithium"],
    "pregnancy_safety": "Category C (Category D in 3rd trimester)",
    "kidney_liver_warning": "Avoid in severe kidney impairment",
    "how_it_works_in_body": "Reduces inflammation and pain by blocking prostaglandin synthesis.",
    "onset_of_action": "1 hour",
    "duration_of_effect": "8-12 hours",
    "prescription_required": true,
    "ayurvedic_or_allopathic": "Allopathic",
    "india_regulatory_status": "CDSCO Approved",
    "quick_summary": "Long-acting pain reliever for headaches, arthritis, and muscle aches.",
    "who_should_take": "Patients needing sustained pain relief for inflammatory conditions.",
    "who_should_not_take": "Individuals with a history of stomach ulcers or severe heart disease.",
    "food_interactions": ["Take with food or milk to reduce stomach upset"],
    "alcohol_warning": "Increases the risk of stomach bleeding."
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

console.log('Successfully updated medicines, diseases, and categories.');
