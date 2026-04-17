export type Language = 'en' | 'hi' | 'mr' | 'ta';

export interface Medicine {
  id: string;
  category: string;
  drug_name: string;
  brand_names_india: string[];
  drug_class: string;
  mechanism_of_action: string;
  uses: string[];
  dosage_common: string;
  side_effects_common: string[];
  side_effects_serious: string[];
  overdose_effects: string;
  contraindications: string[];
  drug_interactions: string[];
  pregnancy_safety: string;
  kidney_liver_warning: string;
  how_it_works_in_body: string;
  onset_of_action: string;
  duration_of_effect: string;
  prescription_required: boolean;
  ayurvedic_or_allopathic: string;
  india_regulatory_status: string;
  quick_summary: string;
  is_banned?: boolean;
  source?: string;
  who_should_take: string;
  who_should_not_take: string;
  food_interactions: string[];
  alcohol_warning: string;
  missed_dose?: string;
}

export interface Disease {
  id: string;
  name: string;
  icon: string;
  symptoms: string[];
}

export const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'mr', name: 'मराठी' },
  { code: 'ta', name: 'தமிழ்' },
];

export const DISEASES: Disease[] = [
  { id: 'fever', name: 'Fever', icon: 'Thermometer', symptoms: ['High temperature', 'Chills'] },
  { id: 'cold', name: 'Cold & Cough', icon: 'Wind', symptoms: ['Runny nose', 'Cough', 'Sore throat'] },
  { id: 'headache', name: 'Headache', icon: 'Brain', symptoms: ['Pain in head', 'Pressure'] },
  { id: 'diabetes', name: 'Diabetes', icon: 'Activity', symptoms: ['High blood sugar', 'Thirst', 'Fatigue'] },
  { id: 'hypertension', name: 'Hypertension', icon: 'TrendingUp', symptoms: ['High blood pressure', 'Dizziness'] },
  { id: 'acidity', name: 'Acidity', icon: 'Flame', symptoms: ['Heartburn', 'Stomach pain'] },
  { id: 'allergies', name: 'Allergies', icon: 'ShieldAlert', symptoms: ['Sneezing', 'Itching', 'Rashes'] },
  { id: 'infections', name: 'Infections', icon: 'Bug', symptoms: ['Fever', 'Pain', 'Swelling'] },
  { id: 'asthma', name: 'Asthma', icon: 'Lungs', symptoms: ['Shortness of breath', 'Wheezing'] },
  { id: 'joint_pain', name: 'Joint Pain', icon: 'Activity', symptoms: ['Stiffness', 'Swelling'] },
  { id: 'skin_issues', name: 'Skin Issues', icon: 'User', symptoms: ['Rashes', 'Itching'] },
  { id: 'eye_strain', name: 'Eye Strain', icon: 'Eye', symptoms: ['Fatigue', 'Blurred vision'] },
  { id: 'fatigue', name: 'Fatigue', icon: 'BatteryLow', symptoms: ['Tiredness', 'Weakness'] },
  { id: 'heart_health', name: 'Heart Health', icon: 'HeartPulse', symptoms: ['Chest pain', 'Palpitations'] },
  { id: 'stomach_flu', name: 'Stomach Flu', icon: 'Soup', symptoms: ['Nausea', 'Vomiting'] },
  { id: 'back_pain', name: 'Back Pain', icon: 'Accessibility', symptoms: ['Aching', 'Stiffness'] },
  { id: 'migraine', name: 'Migraine', icon: 'Zap', symptoms: ['Severe headache', 'Nausea'] },
  { id: 'thyroid', name: 'Thyroid', icon: 'Activity', symptoms: ['Weight changes', 'Fatigue'] },
  { id: 'anxiety', name: 'Anxiety', icon: 'Wind', symptoms: ['Restlessness', 'Worry'] },
  { id: 'sleep_disturbances', name: 'Sleep Issues', icon: 'Moon', symptoms: ['Insomnia', 'Tiredness'] },
];
