import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../LanguageContext';
import { useToast } from '../ToastContext';
import { Medicine } from '../types';
import { fetchMedicineDetails, generateTTS } from '../services/geminiService';
import { Search } from '../components/Search';
import { motion } from 'motion/react';
import { 
  Share2,
  AlertCircle, 
  ChevronLeft, 
  Info, 
  Activity, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Stethoscope,
  Loader2,
  Scale,
  Zap,
  ShieldCheck,
  Leaf,
  Baby,
  Heart,
  Timer,
  ArrowRightLeft,
  UserCheck,
  UserX,
  Utensils,
  Beer,
  Volume2,
  Square,
  MessageSquareWarning
} from 'lucide-react';

import { useCompare } from '../CompareContext';
import { FeedbackModal } from '../components/FeedbackModal';

export const MedicineDetail: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const { addToCompare, removeFromCompare, compareList } = useCompare();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speakingSection, setSpeakingSection] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (name) {
        setLoading(true);
        const data = await fetchMedicineDetails(name, language);
        setMedicine(data);
        setLoading(false);
      }
    };
    loadData();
    window.scrollTo(0, 0);
  }, [name, language]);

  const isAlreadyInCompare = medicine ? compareList.includes(medicine.drug_name) : false;

  const handleAddToCompare = () => {
    if (medicine) {
      if (isAlreadyInCompare) {
        removeFromCompare(medicine.drug_name);
        showToast(`Removed ${medicine.drug_name} from comparison.`, 'info');
      } else {
        addToCompare(medicine.drug_name);
        showToast(`Added ${medicine.drug_name} to comparison.`, 'success');
      }
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setSpeakingSection(null);
  };

  const playAudio = async (text: string, sectionTitle?: string) => {
    if (isPlaying && (sectionTitle === speakingSection || !sectionTitle)) {
      stopAudio();
      return;
    }

    stopAudio();
    setIsTtsLoading(true);
    if (sectionTitle) setSpeakingSection(sectionTitle);

    try {
      const base64Audio = await generateTTS(text);
      if (!base64Audio) throw new Error("Failed to generate audio");

      // Decode base64 PCM data
      const binaryString = atob(base64Audio.split(',')[1]);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert to Float32Array for AudioBuffer (assuming 16-bit PCM)
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        setSpeakingSection(null);
      };

      sourceNodeRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio playback error:", err);
      // Fallback to Web Speech API
      const utterance = new SpeechSynthesisUtterance(text);
      if (language === 'hi') utterance.lang = 'hi-IN';
      else if (language === 'ta') utterance.lang = 'ta-IN';
      else if (language === 'mr') utterance.lang = 'mr-IN';
      else utterance.lang = 'en-US';
      
      utterance.onend = () => {
        setIsPlaying(false);
        setSpeakingSection(null);
      };
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    } finally {
      setIsTtsLoading(false);
    }
  };

  const handleSpeakSection = (title: string, content: string | string[]) => {
    const textToRead = Array.isArray(content) ? content.join('. ') : content;
    playAudio(`${title}. ${textToRead}`, title);
  };

  const toggleSpeech = () => {
    if (!medicine) return;

    // Create a comprehensive text to read
    const textToRead = `
      ${medicine.drug_name}. 
      Class: ${medicine.drug_class}. 
      Summary: ${medicine.quick_summary}.
      
      Uses: ${Array.isArray(medicine.uses) ? medicine.uses.join('. ') : medicine.uses}.
      
      Mechanism of Action: ${medicine.mechanism_of_action}.
      
      Common Dosage: ${medicine.dosage_common}.
      
      Common Side Effects: ${Array.isArray(medicine.side_effects_common) ? medicine.side_effects_common.join('. ') : medicine.side_effects_common}.
      
      Serious Side Effects: ${Array.isArray(medicine.side_effects_serious) ? medicine.side_effects_serious.join('. ') : medicine.side_effects_serious}.
      
      Pregnancy Safety: ${medicine.pregnancy_safety}.
    `;

    playAudio(textToRead);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
          <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center relative z-10 border border-gray-100">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-black text-black mb-2">{t('analyzingMedicine')}</h3>
          <p className="text-gray-500 font-medium max-w-xs mx-auto">
            {t('gatheringData')}
          </p>
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-4xl font-black text-black mb-4 tracking-tight">{t('medicineNotFound')}</h2>
        <p className="text-gray-500 mb-12 max-w-md font-medium">
          {t('medicineNotFoundDesc').replace('{name}', name || '')}
        </p>
        
        <div className="w-full max-w-md mb-12">
          <Search />
        </div>

        <Link to="/" className="px-8 py-4 bg-black text-white rounded-full font-black flex items-center gap-2 shadow-xl hover:bg-gray-800 transition-all">
          <ChevronLeft className="w-4 h-4" /> {t('backToHome')}
        </Link>
      </div>
    );
  }

  const handleWhatsAppShare = () => {
    if (!medicine) return;
    const message = `Check out *${medicine.drug_name}* details on Aethelcare 🇮🇳\n\nClass: ${medicine.drug_class}\nSummary: ${medicine.quick_summary}\n\nFull Details: https://aethelcare.xyz/medicine/${encodeURIComponent(medicine.drug_name)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${medicine.drug_name} - ${t('appName')}`,
          text: medicine.quick_summary,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!', 'success');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        showToast('Failed to copy link.', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen pt-40 pb-20 pt-[calc(10rem+env(safe-area-inset-top))]">
      <Helmet>
        <title>{medicine.drug_name} Uses, Side Effects & CDSCO Status - Aethelcare</title>
        <meta name="description" content={`Learn about ${medicine.drug_name}: uses, side effects, precautions, interactions, and CDSCO status. ${medicine.quick_summary}`} />
        <meta name="keywords" content={`${medicine.drug_name} uses, ${medicine.drug_name} side effects, ${medicine.drug_name} India price, ${medicine.drug_name} safe for pregnancy, medicine scanner, CDSCO status ${medicine.drug_name}`} />
        <meta property="og:title" content={`${medicine.drug_name} Detailed Guide - Aethelcare`} />
        <meta property="og:description" content={`Verified information on ${medicine.drug_name}. Side effects: ${Array.isArray(medicine.side_effects_common) ? medicine.side_effects_common[0] : medicine.side_effects_common}`} />
        <link rel="canonical" href={`https://aethelcare.xyz/medicine/${encodeURIComponent(medicine.drug_name)}`} />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Drug",
              "name": "${medicine.drug_name}",
              "drugClass": "${medicine.drug_class}",
              "description": "${medicine.quick_summary}",
              "legalStatus": "${medicine.india_regulatory_status}",
              "indication": "${Array.isArray(medicine.uses) ? medicine.uses[0] : medicine.uses}",
              "sideEffect": "${Array.isArray(medicine.side_effects_common) ? medicine.side_effects_common[0] : medicine.side_effects_common}"
            }
          `}
        </script>
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium">
            <ChevronLeft className="w-4 h-4" />
            {t('backToSearch')}
          </Link>
          {!navigator.onLine && (
            <div className="px-4 py-2 bg-yellow-50 text-yellow-800 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2 border border-yellow-100 shadow-sm">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              {t('viewingOfflineData')}
            </div>
          )}
          {medicine?.source && (
            <div className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2 border shadow-sm ${
              medicine.source === 'Verified Database' ? 'bg-blue-50 text-blue-800 border-blue-100' :
              medicine.source === 'Community DB' ? 'bg-green-50 text-green-800 border-green-100' :
              medicine.source === 'AI Analysis' ? 'bg-purple-50 text-purple-800 border-purple-100' :
              'bg-gray-50 text-gray-800 border-gray-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                medicine.source === 'Verified Database' ? 'bg-blue-400' :
                medicine.source === 'Community DB' ? 'bg-green-400' :
                medicine.source === 'AI Analysis' ? 'bg-purple-400' :
                'bg-gray-400'
              }`} />
              {t('source')}: {medicine.source}
            </div>
          )}
        </div>

        {/* Hero Section - Text Only */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                  {medicine.prescription_required ? t('prescriptionRequired') : t('otcNonPrescription')}
                </span>
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                  {medicine.ayurvedic_or_allopathic}
                </span>
                {medicine.india_regulatory_status?.toLowerCase().includes('approved') && (
                  <span className="px-4 py-1.5 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> {t('cdscoVerified')}
                  </span>
                )}
                {medicine.is_banned && (
                  <span className="px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-1.5 animate-pulse">
                    <ShieldAlert className="w-3.5 h-3.5" /> {t('bannedDrug')}
                  </span>
                )}
              </div>
              <h1 className="text-6xl md:text-7xl font-black text-black tracking-tighter mb-2 leading-none">
                {medicine.drug_name}
              </h1>
              <p className="text-2xl text-gray-400 font-medium tracking-tight mb-4">
                {medicine.drug_class}
              </p>
              <div className="flex flex-wrap gap-2">
                {medicine.brand_names_india.map((brand, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-lg">
                    {brand}
                  </span>
                ))}
              </div>
            </div>

             <div className="flex flex-wrap gap-3">
              <button
                onClick={handleWhatsAppShare}
                disabled={isTtsLoading}
                className="flex items-center gap-2 px-8 py-4 rounded-full text-sm font-black transition-all shadow-xl active:scale-95 bg-green-500 text-white hover:bg-green-600"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={toggleSpeech}
                disabled={isTtsLoading}
                className={`flex items-center gap-2 px-8 py-4 rounded-full text-sm font-black transition-all shadow-xl active:scale-95 ${
                  isPlaying && !speakingSection
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-black border border-gray-100 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                {isTtsLoading && !speakingSection ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying && !speakingSection ? (
                  <Square className="w-4 h-4 fill-current" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                {isPlaying && !speakingSection ? t('stop') : t('listen')}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-8 py-4 rounded-full text-sm font-black transition-all shadow-xl active:scale-95 bg-white text-black border border-gray-100 hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4" />
                {t('share')}
              </button>
              <button
                onClick={handleAddToCompare}
                className={`flex items-center gap-2 px-8 py-4 rounded-full text-sm font-black transition-all shadow-xl active:scale-95 ${
                  isAlreadyInCompare 
                    ? 'bg-black text-white' 
                    : 'bg-white text-black border border-gray-100 hover:bg-gray-50'
                }`}
              >
                <Scale className="w-4 h-4" />
                {isAlreadyInCompare ? t('removeFromCompare') : `+ ${t('compare')}`}
              </button>
              <button
                onClick={() => setIsFeedbackOpen(true)}
                className="flex items-center gap-2 px-8 py-4 rounded-full text-sm font-black transition-all shadow-xl active:scale-95 bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 hover:text-black"
              >
                <MessageSquareWarning className="w-4 h-4" />
                {t('reportIssue')}
              </button>
            </div>
          </div>

          {medicine.is_banned && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                boxShadow: [
                  "0 20px 25px -5px rgba(220, 38, 38, 0.1), 0 8px 10px -6px rgba(220, 38, 38, 0.1)",
                  "0 20px 25px -5px rgba(220, 38, 38, 0.4), 0 8px 10px -6px rgba(220, 38, 38, 0.4)",
                  "0 20px 25px -5px rgba(220, 38, 38, 0.1), 0 8px 10px -6px rgba(220, 38, 38, 0.1)"
                ]
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              className="bg-red-600 text-white p-8 rounded-[2.5rem] shadow-2xl mb-8 relative overflow-hidden border-4 border-red-400"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="flex items-center gap-4 mb-4">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"
                >
                  <ShieldAlert className="w-8 h-8" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">{t('bannedDrugWarning')}</h2>
                  <p className="text-red-100 font-bold">{t('prohibitedInIndia')}</p>
                </div>
              </div>
              <p className="text-xl font-bold leading-tight mb-4">
                {t('bannedDrugNotice')}
              </p>
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest bg-black/20 w-fit px-4 py-2 rounded-full">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                {t('doNotConsume')}
              </div>
            </motion.div>
          )}

          <div className={`p-8 rounded-[2.5rem] shadow-2xl mb-8 relative overflow-hidden ${medicine.is_banned ? 'bg-black text-white' : 'bg-blue-600 text-white'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <p className="text-sm font-black uppercase tracking-[0.2em] mb-2 opacity-60">{t('quickSummary')}</p>
            <p className="text-2xl font-bold leading-tight">{medicine.quick_summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('category')}</p>
              <p className="text-lg font-bold text-black">{medicine.category}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('regulatoryStatus')}</p>
              <p className="text-lg font-bold text-blue-600">{medicine.india_regulatory_status}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('safety')}</p>
              <p className="text-lg font-bold text-green-600">{t('verifiedInfo')}</p>
            </div>
          </div>
        </motion.div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 gap-6 mb-16">
          <Section 
            icon={<Activity className="w-5 h-5" />} 
            title={t('usesConditions')} 
            content={medicine.uses} 
            onSpeak={handleSpeakSection}
            isSpeaking={speakingSection === t('usesConditions')}
            isLoading={isTtsLoading}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section 
              icon={<Zap className="w-5 h-5" />} 
              title={t('mechanismOfAction')} 
              content={medicine.mechanism_of_action} 
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('mechanismOfAction')}
              isLoading={isTtsLoading}
            />
            <Section 
              icon={<Stethoscope className="w-5 h-5" />} 
              title={t('commonDosage')} 
              content={medicine.dosage_common} 
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('commonDosage')}
              isLoading={isTtsLoading}
            />
          </div>

          <Section 
            icon={<Info className="w-5 h-5" />} 
            title={t('howItWorksBody')} 
            content={medicine.how_it_works_in_body} 
            onSpeak={handleSpeakSection}
            isSpeaking={speakingSection === t('howItWorksBody')}
            isLoading={isTtsLoading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section 
              icon={<Clock className="w-5 h-5" />} 
              title={t('onsetOfAction')} 
              content={medicine.onset_of_action} 
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('onsetOfAction')}
              isLoading={isTtsLoading}
            />
            <Section 
              icon={<Timer className="w-5 h-5" />} 
              title={t('durationOfEffect')} 
              content={medicine.duration_of_effect} 
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('durationOfEffect')}
              isLoading={isTtsLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section 
              icon={<UserCheck className="w-5 h-5" />} 
              title={t('whoShouldTake')} 
              content={medicine.who_should_take} 
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('whoShouldTake')}
              isLoading={isTtsLoading}
            />
            <Section 
              icon={<UserX className="w-5 h-5" />} 
              title={t('whoShouldNotTake')} 
              content={medicine.who_should_not_take} 
              variant="danger"
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('whoShouldNotTake')}
              isLoading={isTtsLoading}
            />
          </div>

          {medicine.missed_dose && (
            <Section 
              icon={<Clock className="w-5 h-5" />} 
              title={t('missedDose')} 
              content={medicine.missed_dose} 
              variant="warning"
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('missedDose')}
              isLoading={isTtsLoading}
            />
          )}

          <Section 
            icon={<AlertCircle className="w-5 h-5" />} 
            title={t('commonSideEffects')} 
            content={medicine.side_effects_common} 
            onSpeak={handleSpeakSection}
            isSpeaking={speakingSection === t('commonSideEffects')}
            isLoading={isTtsLoading}
          />

          <Section 
            icon={<AlertTriangle className="w-5 h-5" />} 
            title={t('seriousSideEffects')} 
            content={medicine.side_effects_serious} 
            variant="warning"
            onSpeak={handleSpeakSection}
            isSpeaking={speakingSection === t('seriousSideEffects')}
            isLoading={isTtsLoading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section 
              icon={<Baby className="w-5 h-5" />} 
              title={t('pregnancySafety')} 
              content={medicine.pregnancy_safety} 
              variant="warning"
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('pregnancySafety')}
              isLoading={isTtsLoading}
            />
            <Section 
              icon={<Heart className="w-5 h-5" />} 
              title={t('kidneyLiverWarning')} 
              content={medicine.kidney_liver_warning} 
              variant="warning"
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('kidneyLiverWarning')}
              isLoading={isTtsLoading}
            />
          </div>

          <Section 
            icon={<ArrowRightLeft className="w-5 h-5" />} 
            title={t('drugInteractions')} 
            content={medicine.drug_interactions} 
            variant="warning"
            onSpeak={handleSpeakSection}
            isSpeaking={speakingSection === t('drugInteractions')}
            isLoading={isTtsLoading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section 
              icon={<Utensils className="w-5 h-5" />} 
              title={t('foodInteractions')} 
              content={medicine.food_interactions} 
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('foodInteractions')}
              isLoading={isTtsLoading}
            />
            <Section 
              icon={<Beer className="w-5 h-5" />} 
              title={t('alcoholWarning')} 
              content={medicine.alcohol_warning} 
              variant="danger"
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('alcoholWarning')}
              isLoading={isTtsLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section 
              icon={<AlertTriangle className="w-5 h-5" />} 
              title={t('overdoseEffects')} 
              content={medicine.overdose_effects} 
              variant="danger"
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('overdoseEffects')}
              isLoading={isTtsLoading}
            />
            <Section 
              icon={<ShieldAlert className="w-5 h-5" />} 
              title={t('contraindications')} 
              content={medicine.contraindications} 
              variant="danger"
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('contraindications')}
              isLoading={isTtsLoading}
            />
          </div>
        </div>

        {/* Disclaimer Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-amber-50 border-2 border-amber-200 p-12 md:p-20 rounded-[4rem] text-center mb-16 relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-300/10 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />
          
          <div className="w-20 h-20 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 relative z-10 border border-amber-200 shadow-inner">
            <ShieldAlert className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-3xl font-black mb-6 tracking-tighter text-amber-900 relative z-10">{t('medicalDisclaimer')}</h2>
          <div className="space-y-6 relative z-10">
            <p className="text-2xl text-amber-800 font-bold leading-tight tracking-tight max-w-4xl mx-auto">
              "{t('disclaimer')}"
            </p>
            <div className="w-20 h-1 bg-amber-200 mx-auto rounded-full opacity-50" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600/60 max-w-2xl mx-auto leading-loose">
              {t('educationalDisclaimer')}
            </p>
          </div>
        </motion.div>
      </div>
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        medicineName={medicine.drug_name} 
      />
    </div>
  );
};

const Section: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  content: string | string[]; 
  variant?: 'default' | 'warning' | 'danger';
  onSpeak?: (title: string, content: string | string[]) => void;
  isSpeaking?: boolean;
  isLoading?: boolean;
}> = ({ 
  icon, title, content, variant = 'default', onSpeak, isSpeaking, isLoading 
}) => {
  const styles = {
    default: 'bg-white border-gray-100',
    warning: 'bg-yellow-50/30 border-yellow-100',
    danger: 'bg-red-50/30 border-red-100'
  };

  const titleStyles = {
    default: 'text-gray-400',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`p-10 rounded-[2.5rem] border shadow-sm hover:shadow-xl transition-all duration-500 ${styles[variant]}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className={`flex items-center gap-3 font-black uppercase tracking-[0.2em] text-[10px] ${titleStyles[variant]}`}>
          <div className={`p-2 rounded-xl ${variant === 'default' ? 'bg-gray-50 text-black' : ''}`}>
            {icon}
          </div>
          {title}
        </div>
        {onSpeak && (
          <button 
            onClick={(e) => { e.stopPropagation(); onSpeak(title, content); }}
            disabled={isLoading && isSpeaking}
            className={`p-2 rounded-lg transition-colors ${isSpeaking ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-black'} disabled:opacity-50`}
            title="Listen to this section"
          >
            {isLoading && isSpeaking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isSpeaking ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
      {Array.isArray(content) ? (
        <ul className="list-disc list-inside space-y-2">
          {content.map((item, index) => (
            <li key={index} className="text-xl text-gray-800 font-bold leading-relaxed tracking-tight">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xl text-gray-800 font-bold leading-relaxed tracking-tight">{content}</p>
      )}
    </motion.div>
  );
};
