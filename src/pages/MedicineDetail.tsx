import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../LanguageContext';
import { useToast } from '../ToastContext';
import { Medicine } from '../types';
import { fetchMedicineDetails, generateTTS } from '../services/geminiService';
import { offlineService } from '../services/offlineService';
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
        
        const cacheData = offlineService.getMedicine(name);
        if (cacheData) {
          setMedicine(cacheData);
          setLoading(false);
          if (navigator.onLine) {
            fetchMedicineDetails(name, language).then(freshData => {
              if (freshData) {
                setMedicine(freshData);
                offlineService.saveMedicine(freshData);
              }
            });
          }
          return;
        }

        const data = await fetchMedicineDetails(name, language);
        if (data) {
          setMedicine(data);
          offlineService.saveMedicine(data);
        }
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

      const binaryString = atob(base64Audio.split(',')[1]);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

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
    const textToRead = `
      ${medicine.drug_name}. 
      Class: ${medicine.drug_class}. 
      Summary: ${medicine.quick_summary}.
    `;
    playAudio(textToRead);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="w-20 h-20 bg-surface rounded-3xl shadow-2xl flex items-center justify-center relative z-10 border border-border">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-black text-text-primary mb-2">{t('analyzingMedicine')}</h3>
          <p className="text-text-secondary font-medium max-w-xs mx-auto">
            {t('gatheringData')}
          </p>
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-bg rounded-[2rem] flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-text-secondary opacity-30" />
        </div>
        <h2 className="text-4xl font-black text-text-primary mb-4 tracking-tight">{t('medicineNotFound')}</h2>
        <p className="text-text-secondary mb-12 max-w-md font-medium">
          {t('medicineNotFoundDesc').replace('{name}', name || '')}
        </p>
        <div className="w-full max-w-md mb-12">
          <Search />
        </div>
        <Link to="/" className="px-8 py-4 bg-dark-bg text-white rounded-full font-black flex items-center gap-2 shadow-xl hover:opacity-90 transition-all">
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
    <div className="min-h-screen pt-40 pb-20 pt-[calc(10rem+env(safe-area-inset-top))] bg-transparent">
      <Helmet>
        <title>{medicine.drug_name} Uses, Side Effects, Dosage & CDSCO Status - Aethelcare India</title>
        <meta name="description" content={`Updated Oct 2025: All about ${medicine.drug_name}. Uses, side effects, dosage and safety information.`} />
        <link rel="canonical" href={`https://aethelcare.xyz/medicine/${encodeURIComponent(medicine.drug_name)}`} />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="flex items-center justify-between mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors font-bold text-sm tracking-tight">
            <ChevronLeft className="w-4 h-4" />
            {t('backToSearch')}
          </Link>
          {!navigator.onLine && (
            <div className="px-5 py-2.5 backdrop-blur-md bg-amber-50/60 text-amber-800 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2 border border-amber-100/50 shadow-sm">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              {t('viewingOfflineData')}
            </div>
          )}
          {medicine?.source && (
            <div className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2 border shadow-sm backdrop-blur-md ${
              medicine.source === 'Verified Database' ? 'bg-primary/5 text-primary border-primary/10' :
              medicine.source === 'Community DB' ? 'bg-success/5 text-success border-success/10' :
              medicine.source === 'AI Analysis' ? 'bg-indigo-50/60 text-indigo-800 border-indigo-100/50' :
              'bg-surface/60 text-text-secondary border-border'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                medicine.source === 'Verified Database' ? 'bg-primary' :
                medicine.source === 'Community DB' ? 'bg-success' :
                medicine.source === 'AI Analysis' ? 'bg-indigo-400' :
                'bg-text-secondary'
              }`} />
              {t('source')}: {medicine.source}
            </div>
          )}
        </div>
 
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20"
        >
          <div className="flex flex-col gap-10">
            <div>
              <div className="flex flex-wrap gap-3 mb-8">
                <span className="px-5 py-2 bg-dark-bg text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-full shadow-lg">
                  {medicine.prescription_required ? t('prescriptionRequired') : t('otcNonPrescription')}
                </span>
                <span className="px-5 py-2 backdrop-blur-md bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.25em] rounded-full border border-primary/10">
                  {medicine.ayurvedic_or_allopathic}
                </span>
                {medicine.india_regulatory_status?.toLowerCase().includes('approved') && (
                  <span className="px-5 py-2 backdrop-blur-md bg-success/5 text-success text-[10px] font-black uppercase tracking-[0.25em] rounded-full border border-success/10 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> {t('cdscoVerified')}
                  </span>
                )}
                {medicine.is_banned && (
                  <span className="px-5 py-2 bg-danger text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-full flex items-center gap-2 animate-pulse shadow-lg shadow-danger/20">
                    <ShieldAlert className="w-3.5 h-3.5" /> {t('bannedDrug')}
                  </span>
                )}
              </div>
              <h1 className="text-7xl md:text-8xl lg:text-9xl font-black text-text-primary tracking-[-0.05em] mb-4 leading-[0.8]">
                {medicine.drug_name}
              </h1>
              <p className="text-3xl md:text-4xl text-text-secondary font-bold tracking-tight mb-8">
                {medicine.drug_class}
              </p>
              <div className="flex flex-wrap gap-2.5">
                <span className="text-xs font-black uppercase tracking-widest text-text-secondary opacity-50 mr-2 self-center">Brand Names:</span>
                {medicine.brand_names_india.map((brand, i) => (
                  <span key={i} className="px-4 py-1.5 backdrop-blur-md bg-surface/40 text-text-secondary text-[10px] font-black rounded-lg border border-surface uppercase tracking-wider shadow-sm">
                    {brand}
                  </span>
                ))}
              </div>
            </div>
 
             <div className="flex flex-wrap gap-4 pt-10 border-t border-border/50">
              <button
                onClick={handleWhatsAppShare}
                disabled={isTtsLoading}
                className="flex flex-1 items-center justify-center gap-3 px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 bg-success text-white hover:opacity-90"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={toggleSpeech}
                disabled={isTtsLoading}
                className={`flex flex-1 items-center justify-center gap-3 px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all shadow-[0_8px_32px_rgba(0,0,0,0.05)] active:scale-95 ${
                  isPlaying && !speakingSection
                    ? 'bg-primary text-white' 
                    : 'backdrop-blur-xl bg-surface/80 text-text-primary border border-surface hover:bg-surface'
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
                className="flex items-center gap-3 px-8 py-5 rounded-[2rem] backdrop-blur-xl bg-surface/80 text-text-primary border border-surface font-black text-xs uppercase tracking-widest active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:bg-surface"
              >
                <Share2 className="w-4 h-4" />
                {t('share')}
              </button>
              <button
                onClick={handleAddToCompare}
                className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] backdrop-blur-xl font-black text-xs uppercase tracking-widest active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.05)] ${
                  isAlreadyInCompare 
                    ? 'bg-dark-bg text-white' 
                    : 'bg-surface/80 text-text-primary border border-surface hover:bg-surface'
                }`}
              >
                <Scale className="w-4 h-4" />
                {isAlreadyInCompare ? t('removeFromCompare') : `Compare`}
              </button>
            </div>
          </div>
 
          {medicine.is_banned && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
              }}
              className="mt-12 bg-danger text-white p-10 rounded-[3.5rem] shadow-[0_30px_60px_rgba(220,38,38,0.25)] relative overflow-hidden border-2 border-danger/40 group"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-[100px] transition-transform group-hover:scale-125" />
              <div className="flex items-start gap-6 mb-8">
                <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-xl border border-white/20 shadow-inner">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-[-0.04em] leading-none mb-2">{t('bannedDrugWarning')}</h2>
                  <p className="text-white/80 font-black uppercase tracking-widest text-xs opacity-80">{t('prohibitedInIndia')}</p>
                </div>
              </div>
              <p className="text-2xl font-black leading-[1.1] mb-8 tracking-tight">
                {t('bannedDrugNotice')}
              </p>
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] bg-black/30 backdrop-blur-md w-fit px-6 py-3 rounded-2xl border border-white/10">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                {t('doNotConsume')}
              </div>
            </motion.div>
          )}
 
          <div className={`mt-12 p-10 rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden border border-white animate-in slide-in-from-bottom-5 duration-700 ${medicine.is_banned ? 'bg-dark-bg text-white' : 'bg-primary text-white shadow-primary/20'}`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
            <p className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 opacity-50">{t('quickSummary')}</p>
            <p className="text-3xl font-black leading-[1.1] tracking-tight">{medicine.quick_summary}</p>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="backdrop-blur-xl bg-surface/60 p-8 rounded-[2.5rem] border border-surface shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2">{t('category')}</p>
              <p className="text-xl font-black text-text-primary tracking-tight">{medicine.category}</p>
            </div>
            <div className="backdrop-blur-xl bg-surface/60 p-8 rounded-[2.5rem] border border-surface shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2">{t('regulatoryStatus')}</p>
              <p className="text-xl font-black text-primary tracking-tight">{medicine.india_regulatory_status}</p>
            </div>
            <div className="backdrop-blur-xl bg-surface/60 p-8 rounded-[2.5rem] border border-surface shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2">{t('safety')}</p>
              <p className="text-xl font-black text-success tracking-tight">{t('verifiedInfo')}</p>
            </div>
          </div>
        </motion.div>
 
        {/* Detailed Sections */}
        <div className="grid grid-cols-1 gap-8 mb-24">
          <Section 
            icon={<Activity className="w-6 h-6" />} 
            title={t('usesConditions')} 
            content={medicine.uses} 
            onSpeak={handleSpeakSection}
            isSpeaking={speakingSection === t('usesConditions')}
            isLoading={isTtsLoading}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Section 
              icon={<Zap className="w-6 h-6" />} 
              title={t('mechanismOfAction')} 
              content={medicine.mechanism_of_action} 
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('mechanismOfAction')}
              isLoading={isTtsLoading}
            />
            <Section 
              icon={<Stethoscope className="w-6 h-6" />} 
              title={t('commonDosage')} 
              content={medicine.dosage_common} 
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('commonDosage')}
              isLoading={isTtsLoading}
            />
          </div>
 
          <Section 
            icon={<Info className="w-6 h-6" />} 
            title={t('howItWorksBody')} 
            content={medicine.how_it_works_in_body} 
            onSpeak={handleSpeakSection}
            isSpeaking={speakingSection === t('howItWorksBody')}
            isLoading={isTtsLoading}
          />
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Section 
              icon={<Clock className="w-6 h-6" />} 
              title={t('onsetOfAction')} 
              content={medicine.onset_of_action} 
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('onsetOfAction')}
              isLoading={isTtsLoading}
            />
            <Section 
              icon={<Timer className="w-6 h-6" />} 
              title={t('durationOfEffect')} 
              content={medicine.duration_of_effect} 
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('durationOfEffect')}
              isLoading={isTtsLoading}
            />
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Section 
              icon={<UserCheck className="w-6 h-6" />} 
              title={t('whoShouldTake')} 
              content={medicine.who_should_take} 
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('whoShouldTake')}
              isLoading={isTtsLoading}
            />
            <Section 
              icon={<UserX className="w-6 h-6" />} 
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
              icon={<Clock className="w-6 h-6" />} 
              title={t('missedDose')} 
              content={medicine.missed_dose} 
              variant="warning"
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('missedDose')}
              isLoading={isTtsLoading}
            />
          )}
 
          <Section 
            icon={<AlertCircle className="w-6 h-6" />} 
            title={t('commonSideEffects')} 
            content={medicine.side_effects_common} 
            onSpeak={handleSpeakSection}
            isSpeaking={speakingSection === t('commonSideEffects')}
            isLoading={isTtsLoading}
          />
 
          <Section 
            icon={<AlertTriangle className="w-6 h-6" />} 
            title={t('seriousSideEffects')} 
            content={medicine.side_effects_serious} 
            variant="warning"
            onSpeak={handleSpeakSection}
            isSpeaking={speakingSection === t('seriousSideEffects')}
            isLoading={isTtsLoading}
          />
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Section 
              icon={<Baby className="w-6 h-6" />} 
              title={t('pregnancySafety')} 
              content={medicine.pregnancy_safety} 
              variant="warning"
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('pregnancySafety')}
              isLoading={isTtsLoading}
            />
            <Section 
              icon={<Heart className="w-6 h-6" />} 
              title={t('kidneyLiverWarning')} 
              content={medicine.kidney_liver_warning} 
              variant="warning"
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('kidneyLiverWarning')}
              isLoading={isTtsLoading}
            />
          </div>
 
          <Section 
            icon={<ArrowRightLeft className="w-6 h-6" />} 
            title={t('drugInteractions')} 
            content={medicine.drug_interactions} 
            variant="warning"
            onSpeak={handleSpeakSection}
            isSpeaking={speakingSection === t('drugInteractions')}
            isLoading={isTtsLoading}
          />
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Section 
              icon={<Utensils className="w-6 h-6" />} 
              title={t('foodInteractions')} 
              content={medicine.food_interactions} 
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('foodInteractions')}
              isLoading={isTtsLoading}
            />
            <Section 
              icon={<Beer className="w-6 h-6" />} 
              title={t('alcoholWarning')} 
              content={medicine.alcohol_warning} 
              variant="danger"
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('alcoholWarning')}
              isLoading={isTtsLoading}
            />
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Section 
              icon={<AlertTriangle className="w-6 h-6" />} 
              title={t('overdoseEffects')} 
              content={medicine.overdose_effects} 
              variant="danger"
              onSpeak={handleSpeakSection}
              isSpeaking={speakingSection === t('overdoseEffects')}
              isLoading={isTtsLoading}
            />
            <Section 
              icon={<ShieldAlert className="w-6 h-6" />} 
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
          className="backdrop-blur-3xl bg-amber-50/60 border border-amber-200/50 p-16 md:p-28 rounded-[5rem] text-center mb-24 relative overflow-hidden shadow-sm"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full -mr-48 -mt-48 blur-[100px] opacity-50" />
          
          <div className="w-24 h-24 backdrop-blur-2xl bg-amber-500/10 rounded-[3rem] flex items-center justify-center mx-auto mb-10 relative z-10 border border-amber-200 shadow-sm">
            <ShieldAlert className="w-12 h-12 text-amber-600" />
          </div>
          <h2 className="text-4xl font-black mb-8 tracking-[-0.04em] text-amber-950 relative z-10 uppercase">{t('medicalDisclaimer')}</h2>
          <div className="space-y-8 relative z-10">
            <p className="text-3xl text-amber-900/80 font-black leading-[1.1] tracking-tight max-w-4xl mx-auto">
              "{t('disclaimer')}"
            </p>
            <div className="w-32 h-2 bg-amber-200/50 mx-auto rounded-full" />
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-700/60 max-w-3xl mx-auto leading-loose">
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
    default: 'bg-surface/80 border-surface/50',
    warning: 'bg-amber-50/40 border-amber-200/50',
    danger: 'bg-danger/5 border-danger/10'
  };
 
  const titleStyles = {
    default: 'text-text-secondary',
    warning: 'text-amber-700',
    danger: 'text-danger'
  };
 
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`p-12 md:p-14 backdrop-blur-xl rounded-[4rem] border shadow-[0_8px_32px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-700 ${styles[variant]}`}
    >
      <div className="flex items-center justify-between mb-8">
        <div className={`flex items-center gap-4 font-black uppercase tracking-[0.25em] text-[11px] ${titleStyles[variant]}`}>
          <div className={`p-3 rounded-2xl backdrop-blur-md shadow-sm ${variant === 'default' ? 'bg-bg text-text-primary border border-border' : 'bg-current/10'}`}>
            {icon}
          </div>
          {title}
        </div>
        {onSpeak && (
          <button 
            onClick={(e) => { e.stopPropagation(); onSpeak(title, content); }}
            disabled={isLoading && isSpeaking}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${isSpeaking ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-bg text-text-secondary hover:text-text-primary border border-transparent hover:border-border'} disabled:opacity-50 active:scale-90`}
            title="Listen to this section"
          >
            {isLoading && isSpeaking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSpeaking ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {Array.isArray(content) ? (
        <ul className="list-disc list-inside space-y-4">
          {content.map((item, index) => (
            <li key={index} className="text-2xl text-text-primary font-black leading-[1.2] tracking-[-0.02em]">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-2xl text-text-primary font-black leading-[1.2] tracking-[-0.02em]">{content}</p>
      )}
    </motion.div>
  );
};
