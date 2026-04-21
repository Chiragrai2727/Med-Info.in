export interface InteractionWarning {
  drug_a: string;
  drug_b: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  recommendation: string;
}

export const COMMON_INTERACTIONS: InteractionWarning[] = [
  { drug_a: 'aspirin', drug_b: 'warfarin', severity: 'severe', description: 'Combines two blood thinners increasing the risk of serious bleeding.', recommendation: 'Do not combine unless specifically ordered by your cardiologist.' },
  { drug_a: 'metformin', drug_b: 'alcohol', severity: 'moderate', description: 'Can cause lactic acidosis, a rare but very serious condition.', recommendation: 'Avoid heavy alcohol consumption while taking Metformin.' },
  { drug_a: 'ciprofloxacin', drug_b: 'antacids', severity: 'moderate', description: 'Antacids block the absorption of the antibiotic, making it ineffective.', recommendation: 'Take ciprofloxacin at least 2 hours before or 6 hours after antacids.' },
  { drug_a: 'atorvastatin', drug_b: 'clarithromycin', severity: 'severe', description: 'Significantly increases statin levels, risking severe muscle damage (rhabdomyolysis).', recommendation: 'Consult your doctor immediately; the statin might need to be paused.' },
  { drug_a: 'amlodipine', drug_b: 'simvastatin', severity: 'moderate', description: 'Increases simvastatin levels in the blood, leading to possible muscle aches.', recommendation: 'Simvastatin dose should usually not exceed 20mg when taken with amlodipine.' },
  { drug_a: 'methotrexate', drug_b: 'nsaids', severity: 'severe', description: 'NSAIDs (like Ibuprofen) can cause methotrexate toxicity and kidney issues.', recommendation: 'Avoid this combination without strict medical supervision.' },
  { drug_a: 'digoxin', drug_b: 'amiodarone', severity: 'severe', description: 'Amiodarone significantly increases digoxin levels, risking heart rhythm issues.', recommendation: 'Digoxin dose usually needs to be halved.' },
  { drug_a: 'warfarin', drug_b: 'ibuprofen', severity: 'severe', description: 'Increases bleeding risk and gastrointestinal ulceration.', recommendation: 'Avoid NSAIDs; prefer paracetamol for pain if taking warfarin.' },
  { drug_a: 'tramadol', drug_b: 'ssris', severity: 'severe', description: 'Combines two drugs increasing serotonin, risking Serotonin Syndrome.', recommendation: 'Monitor for agitation, rapid heart rate, or rigidity; use cautiously.' },
  { drug_a: 'ace inhibitors', drug_b: 'potassium supplements', severity: 'severe', description: 'Can lead to dangerously high potassium levels in the blood.', recommendation: 'Avoid potassium supplements and salt substitutes unless prescribed.' },
  { drug_a: 'levothyroxine', drug_b: 'calcium supplements', severity: 'moderate', description: 'Calcium prevents the absorption of thyroid medication.', recommendation: 'Take them at least 4 hours apart.' },
  { drug_a: 'sildenafil', drug_b: 'nitrates', severity: 'severe', description: 'Causes a massive, potentially fatal drop in blood pressure.', recommendation: 'Never take these two together under any circumstances.' },
  { drug_a: 'azithromycin', drug_b: 'amiodarone', severity: 'severe', description: 'Increases risk of serious heart rhythm abnormalities (QT prolongation).', recommendation: 'Avoid combining this antibiotic with this heart medication.' },
  { drug_a: 'clopidogrel', drug_b: 'omeprazole', severity: 'moderate', description: 'Omeprazole makes clopidogrel (blood thinner) much less effective.', recommendation: 'Pantoprazole is generally a safer antacid option if taking clopidogrel.' },
  { drug_a: 'methotrexate', drug_b: 'trimethoprim', severity: 'severe', description: 'Increases risk of massive bone marrow suppression.', recommendation: 'A void combining these two completely.' },
  { drug_a: 'spironolactone', drug_b: 'lisinopril', severity: 'severe', description: 'Can cause hyperkalemia (dangerously high potassium levels).', recommendation: 'Requires close monitoring by a physician.' },
  { drug_a: 'lithium', drug_b: 'diuretics', severity: 'moderate', description: 'Diuretics decrease lithium clearance, risking lithium toxicity.', recommendation: 'Lithium levels must be closely monitored and dose adjusted.' },
  { drug_a: 'phenytoin', drug_b: 'oral contraceptives', severity: 'moderate', description: 'Phenytoin reduces the effectiveness of birth control pills.', recommendation: 'Use an alternative or secondary form of contraception.' },
  { drug_a: 'theophylline', drug_b: 'ciprofloxacin', severity: 'severe', description: 'Increases theophylline levels, causing nausea, palpitations, and seizures.', recommendation: 'Usually requires theophylline dose reduction and close monitoring.' },
  { drug_a: 'allopurinol', drug_b: 'azathioprine', severity: 'severe', description: 'Allopurinol blocks the breakdown of azathioprine leading to severe toxicity.', recommendation: 'Azathioprine dose must be drastically reduced.' }
];

export function checkInteractions(medicines: string[]): InteractionWarning[] {
  const normalizedMeds = medicines.map(m => m.toLowerCase().trim());
  const found: InteractionWarning[] = [];
  
  for (let i = 0; i < normalizedMeds.length; i++) {
    for (let j = i + 1; j < normalizedMeds.length; j++) {
      const a = normalizedMeds[i];
      const b = normalizedMeds[j];
      
      const interaction = COMMON_INTERACTIONS.find(
        int => (a.includes(int.drug_a) && b.includes(int.drug_b)) || 
               (a.includes(int.drug_b) && b.includes(int.drug_a))
      );
      
      if (interaction) {
        found.push(interaction);
      }
    }
  }
  
  return found;
}
