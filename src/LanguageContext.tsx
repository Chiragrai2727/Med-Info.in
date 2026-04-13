import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from './types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    appName: 'MedInfo India',
    tagline: 'Search any medicine. Understand it instantly.',
    searchPlaceholder: 'Search for medicine information...',
    disclaimer: 'This platform provides general medicine information. Always consult a qualified doctor before taking any medication.',
    safetyWarning: 'If symptoms persist for more than 3 days, consult a doctor.',
    uses: 'Uses',
    howItWorks: 'How it works',
    dosage: 'Dosage Guidelines',
    sideEffects: 'Side Effects',
    overdose: 'Overdose Risks',
    warnings: 'Warnings',
    category: 'Drug Category',
    popularMedicines: 'Popular Medicines',
    commonConditions: 'Common Conditions',
    loading: 'Fetching information...',
    noResults: 'No medicines found.',
    singleLineSummary: 'Summary',
    compare: 'Compare',
    vs: 'vs',
    feature: 'Feature',
    difference: 'Difference',
    peopleAlsoSearch: 'People also search for',
    suggestedQueries: 'Suggested queries',
    voiceSearch: 'Voice Search',
    listening: 'Listening...',
    offlineTitle: 'You are offline',
    offlineStatus: 'Showing saved data only',
    offlineLimit: 'AI-powered search and dynamic details are limited.',
    offlineAction: 'Refresh the page once you are back online to re-enable all features.',
    refresh: 'Refresh',
    fever: 'Fever',
    cold: 'Cold & Cough',
    headache: 'Headache',
    diabetes: 'Diabetes',
    hypertension: 'Hypertension',
    acidity: 'Acidity',
    allergies: 'Allergies',
    infections: 'Infections',
    share: 'Share',
  },
  hi: {
    appName: 'मेडइन्फो इंडिया',
    tagline: 'किसी भी दवा को खोजें। उसे तुरंत समझें।',
    searchPlaceholder: 'दवा की जानकारी खोजें...',
    disclaimer: 'यह प्लेटफॉर्म सामान्य दवा की जानकारी प्रदान करता है। कोई भी दवा लेने से पहले हमेशा एक योग्य डॉक्टर से सलाह लें।',
    safetyWarning: 'यदि लक्षण 3 दिनों से अधिक समय तक बने रहते हैं, तो डॉक्टर से परामर्श करें।',
    uses: 'उपयोग',
    howItWorks: 'यह कैसे काम करता है',
    dosage: 'खुराक दिशानिर्देश',
    sideEffects: 'दुष्प्रभाव',
    overdose: 'ओवरडोज के जोखिम',
    warnings: 'चेतावनी',
    category: 'दवा श्रेणी',
    popularMedicines: 'लोकप्रिय दवाएं',
    commonConditions: 'सामान्य स्थितियां',
    loading: 'जानकारी प्राप्त की जा रही है...',
    noResults: 'कोई दवा नहीं मिली।',
    singleLineSummary: 'सारांश',
    compare: 'तुलना करें',
    vs: 'बनाम',
    feature: 'विशेषता',
    difference: 'अंतर',
    peopleAlsoSearch: 'लोग यह भी खोजते हैं',
    suggestedQueries: 'सुझाए गए प्रश्न',
    voiceSearch: 'वॉयस सर्च',
    listening: 'सुन रहे हैं...',
    offlineTitle: 'आप ऑफलाइन हैं',
    offlineStatus: 'केवल सहेजा गया डेटा दिखा रहा है',
    offlineLimit: 'एआई-संचालित खोज और गतिशील विवरण सीमित हैं।',
    offlineAction: 'सभी सुविधाओं को फिर से सक्षम करने के लिए वापस ऑनलाइन होने पर पेज को रिफ्रेश करें।',
    refresh: 'रिफ्रेश करें',
    fever: 'बुखार',
    cold: 'सर्दी और खांसी',
    headache: 'सिरदर्द',
    diabetes: 'मधुमेह',
    hypertension: 'उच्च रक्तचाप',
    acidity: 'एसिडिटी',
    allergies: 'एलर्जी',
    infections: 'संक्रमण',
    share: 'साझा करें',
  },
  mr: {
    appName: 'मेडइन्फो इंडिया',
    tagline: 'कोणतेही औषध शोधा. ते त्वरित समजून घ्या.',
    searchPlaceholder: 'औषधाची माहिती शोधा...',
    disclaimer: 'हे प्लॅटफॉर्म सामान्य औषधांची माहिती प्रदान करते. कोणतेही औषध घेण्यापूर्वी नेहमी तज्ञ डॉक्टरांचा सल्ला घ्या.',
    safetyWarning: 'लक्षणे ३ दिवसांपेक्षा जास्त काळ राहिल्यास डॉक्टरांचा सल्ला घ्या.',
    uses: 'उपयोग',
    howItWorks: 'हे कसे कार्य करते',
    dosage: 'डोस मार्गदर्शक तत्त्वे',
    sideEffects: 'दुष्परिणाम',
    overdose: 'ओव्हरडोजचे धोके',
    warnings: 'इशारे',
    category: 'औषध श्रेणी',
    popularMedicines: 'लोकप्रिय औषधे',
    commonConditions: 'सामान्य आजार',
    loading: 'माहिती मिळवत आहे...',
    noResults: 'कोणतेही औषध सापडले नाही.',
    singleLineSummary: 'सारांश',
    compare: 'तुलना करा',
    vs: 'विरुद्ध',
    feature: 'वैशिष्ट्य',
    difference: 'फरक',
    peopleAlsoSearch: 'लोक हे देखील शोधतात',
    suggestedQueries: 'सुचवलेले प्रश्न',
    voiceSearch: 'व्हॉइस सर्च',
    listening: 'ऐकत आहे...',
    offlineTitle: 'तुम्ही ऑफलाइन आहात',
    offlineStatus: 'केवळ जतन केलेला डेटा दर्शवित आहे',
    offlineLimit: 'एआय-आधारित शोध आणि डायनॅमिक तपशील मर्यादित आहेत.',
    offlineAction: 'सर्व वैशिष्ट्ये पुन्हा सक्षम करण्यासाठी तुम्ही परत ऑनलाइन आल्यावर पेज रिफ्रेश करा.',
    refresh: 'रिफ्रेश करा',
    fever: 'ताप',
    cold: 'सर्दी आणि खोकला',
    headache: 'डोकेदुखी',
    diabetes: 'मधुमेह',
    hypertension: 'उच्च रक्तदाब',
    acidity: 'ऍसिडिटी',
    allergies: 'अॅलर्जी',
    infections: 'संसर्ग',
    share: 'शेअर करा',
  },
  ta: {
    appName: 'மெட்இன்போ இந்தியா',
    tagline: 'எந்த மருந்தையும் தேடுங்கள். உடனடியாக புரிந்து கொள்ளுங்கள்.',
    searchPlaceholder: 'மருந்து தகவலைத் தேடுங்கள்...',
    disclaimer: 'இந்த தளம் பொதுவான மருந்து தகவல்களை வழங்குகிறது. எந்தவொரு மருந்தையும் எடுத்துக்கொள்வதற்கு முன் எப்போதும் தகுதியுள்ள மருத்துவரை அணுகவும்.',
    safetyWarning: 'அறிகுறிகள் 3 நாட்களுக்கு மேல் நீடித்தால், மருத்துவரை அணுகவும்.',
    uses: 'பயன்பாடுகள்',
    howItWorks: 'இது எப்படி வேலை செய்கிறது',
    dosage: 'அளவு வழிகாட்டுதல்கள்',
    sideEffects: 'பக்க விளைவுகள்',
    overdose: 'அதிகப்படியான அளவு அபாயங்கள்',
    warnings: 'எச்சரிக்கைகள்',
    category: 'மருந்து வகை',
    popularMedicines: 'பிரபலமான மருந்துகள்',
    commonConditions: 'பொதுவான நிலைகள்',
    loading: 'தகவலைப் பெறுகிறது...',
    noResults: 'மருந்துகள் எதுவும் கிடைக்கவில்லை.',
    singleLineSummary: 'சுருக்கம்',
    compare: 'ஒப்பிடு',
    vs: 'எதிராக',
    feature: 'அம்சம்',
    difference: 'வேறுபாடு',
    peopleAlsoSearch: 'மக்கள் இதையும் தேடுகிறார்கள்',
    suggestedQueries: 'பரிந்துரைக்கப்பட்ட தேடல்கள்',
    voiceSearch: 'குரல் தேடல்',
    listening: 'கேட்கிறது...',
    offlineTitle: 'நீங்கள் ஆஃப்லைனில் உள்ளீர்கள்',
    offlineStatus: 'சேமிக்கப்பட்ட தரவு மட்டுமே காட்டப்படுகிறது',
    offlineLimit: 'AI-இயங்கும் தேடல் மற்றும் டைனாமிக் விவரங்கள் வரையறுக்கப்பட்டுள்ளன.',
    offlineAction: 'அனைத்து அம்சங்களையும் மீண்டும் செயல்படுத்த, நீங்கள் ஆன்லைனில் வந்ததும் பக்கத்தைப் புதுப்பிக்கவும்.',
    refresh: 'புதுப்பி',
    fever: 'காய்ச்சல்',
    cold: 'சளி மற்றும் இருமல்',
    headache: 'தலைவலி',
    diabetes: 'நீரிழிவு நோய்',
    hypertension: 'உயர் இரத்த அழுத்தம்',
    acidity: 'அசிடிட்டி',
    allergies: 'ஒவ்வாமை',
    infections: 'தொற்று',
    share: 'பகிர்',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('medinfo_lang');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('medinfo_lang', language);
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
