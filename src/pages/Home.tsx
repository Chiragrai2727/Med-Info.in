import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../LanguageContext';
import { useToast } from '../ToastContext';
import { Search } from '../components/Search';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ArrowRight, Sparkles, Shield, ShieldCheck, HelpCircle, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompare } from '../CompareContext';
import { FAQ } from '../components/FAQ';
import bannedDrugsData from '../data/banned_medicines.json';
import { useAuth } from '../AuthContext';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export const Home: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPWAHint, setShowPWAHint] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    const hintTimer = setTimeout(() => {
      if (!isStandaloneMode && !deferredPrompt && !isIOSDevice) {
        setShowPWAHint(true);
      }
    }, 100);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(hintTimer);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        showToast('Aethelcare is being installed!', 'success');
      }
    } else if (isIOS) {
      showToast('To install: Tap Share button and then "Add to Home Screen"', 'info');
    } else {
      showToast('Open Aethelcare in a new window to install as an App!', 'info');
    }
  };

  const POPULAR_MEDS = [
    { name: 'Dolo 650', category: t('category_analgesic'), summary: t('doloSummary') },
    { name: 'Augmentin', category: t('category_antibiotic'), summary: t('augmentinSummary') },
    { name: 'Okacet', category: t('category_antihistamine'), summary: t('okacetSummary') },
    { name: 'Pan 40', category: t('category_antacid'), summary: t('pan40Summary') },
  ];

  const TRENDING_SEARCHES = [
    { title: 'Calpol 650 uses in Hindi', desc: 'Frequent query for fever management in India', path: '/medicine/Calpol 650', type: 'Usage', accent: 'text-primary bg-primary/10 border-primary/20' },
    { title: 'Aceclofenac & Paracetamol', desc: 'Common pain and inflammation relief query', path: '/medicine/Aceclofenac', type: 'Safety', accent: 'text-danger bg-danger/10 border-danger/20' },
    { title: 'Paracetamol baby dosage', desc: 'Pediatric oral suspension safety guide', path: '/medicine/Paracetamol', type: 'Dosage', accent: 'text-success bg-success/10 border-success/20' },
    { title: 'Diclofenac Sodium tablets', desc: 'Powerful pain reliever safety reports', path: '/medicine/Diclofenac', type: 'Safety', accent: 'text-danger bg-danger/10 border-danger/20' },
    { title: 'Azithromycin side effects', desc: 'Antibiotic safety and precaution insights', path: '/medicine/Azithromycin', type: 'Usage', accent: 'text-success bg-success/10 border-success/20' },
    { title: 'Ranitidine uses vs safe', desc: 'Acidity medication safety check', path: '/medicine/Ranitidine', type: 'Precaution', accent: 'text-primary/80 bg-primary/10 border-primary/20' },
  ];

  const FEATURED_BANNED = [
    { name: 'Amidopyrine', reason: 'Agranulocytosis (severe drop in white blood cells)' },
    { name: 'Fixed dose combinations of vitamins', reason: 'Prohibited by CDSCO due to safety/efficacy concerns' },
    { name: 'Fixed dose combinations of Atropine', reason: 'Prohibited by CDSCO due to safety/efficacy concerns' },
    { name: 'FDC of Strychnine and Caffeine', reason: 'Prohibited by CDSCO due to safety/efficacy concerns' },
  ];

  useEffect(() => {
    // Component mounted
  }, []);

  return (
    <div className="min-h-screen pt-40 pb-20 bg-bg">
      <Helmet>
        <title>Aethelcare India - Smart AI Medicine Scanner & Drug Safety Platform</title>
        <meta name="description" content="Check if your medicines are banned in India by CDSCO instantly. Use our pharmaceutical AI scanner to understand Calpol 650 uses, Paracetamol baby dosage, and drug interactions." />
        <link rel="canonical" href="https://aethelcare.xyz" />
      </Helmet>
 
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20 relative z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          {/* Hero Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {(!isStandalone && (deferredPrompt || isIOS || showPWAHint)) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleInstall}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95 animate-pulse-slow"
              >
                <Download className="w-4 h-4" /> 
                {isIOS && !deferredPrompt ? 'Install App' : (deferredPrompt ? 'Download App' : 'Get Mobile App')}
              </motion.button>
            )}
            {[
              { icon: Sparkles, text: 'AI Intelligence', color: 'text-primary bg-surface/60 border-surface/80' },
              { icon: ShieldCheck, text: 'CDSCO Verified', color: 'text-success bg-surface/60 border-surface/80' },
              { icon: Shield, text: 'Privacy Protected', color: 'text-text-secondary bg-surface/60 border-surface/80' },
            ].map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`flex items-center gap-2 px-5 py-2 rounded-full border backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_4px_12px_rgba(0,0,0,0.03)] ${badge.color}`}
              >
                <badge.icon className="w-3.5 h-3.5" />
                {badge.text}
              </motion.div>
            ))}
          </div>
          
          <h1 className="text-[42px] md:text-[52px] font-black text-text-primary mb-8 tracking-[-0.05em] max-w-6xl mx-auto leading-[0.85] sm:leading-[0.9]">
            Check if your medicine is banned in India
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary mb-14 max-w-3xl mx-auto font-medium leading-relaxed tracking-tight">
            The simplest way to understand your medicines and safety.
          </p>
          
          <div className="mb-14 relative max-w-2xl mx-auto z-40">
            <div className="backdrop-blur-3xl bg-surface/80 p-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-surface/40">
              <Search 
                autoFocus 
                placeholder="Search any medicine name..."
                onActiveChange={setIsSearchActive}
              />
            </div>
            
            {/* CTA Buttons - Hidden when search is active to prevent overlap */}
            <AnimatePresence>
              {!isSearchActive && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-10 flex flex-wrap justify-center gap-5"
                >
                  <button 
                    onClick={() => navigate('/banned-drugs')}
                    className="px-10 py-4 bg-danger text-white rounded-[1.5rem] font-bold hover:opacity-90 transition-all shadow-[0_12px_24px_rgba(220,38,38,0.3)] active:scale-95 text-sm uppercase tracking-widest"
                  >
                    Check Banned List
                  </button>
                  <button 
                    onClick={() => navigate('/scan')}
                    className="px-10 py-4 bg-primary text-white rounded-[1.5rem] font-bold hover:bg-primary-hover transition-all shadow-[0_8px_32px_rgba(0,0,0,0.05)] active:scale-95 text-sm uppercase tracking-widest"
                  >
                    Scan Free
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
 
          <div className="flex flex-wrap justify-center gap-3 items-center">
            {['Dolo 650', 'Pan-D', 'Combiflam', 'Azithral 500', 'Calpol'].map((q) => (
              <button
                key={q}
                onClick={() => navigate(`/medicine/${encodeURIComponent(q)}`)}
                className="px-5 py-2.5 backdrop-blur-md bg-surface/40 border border-surface/60 rounded-full text-xs font-bold text-text-secondary hover:bg-surface hover:border-border transition-all shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </motion.div>
      </section>
 
      {/* Popular Medicines Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-black text-text-primary tracking-tight leading-none">Popular Medicines</h2>
          <div className="h-px bg-border flex-1 mx-8 hidden md:block opacity-30" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {POPULAR_MEDS.map((med, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => navigate(`/medicine/${encodeURIComponent(med.name)}`)}
              className="p-10 backdrop-blur-xl bg-surface/80 rounded-[3rem] border border-surface/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 rounded-full -mr-10 -mt-10 flex items-center justify-center transition-transform group-hover:scale-110">
                <HelpCircle className="w-6 h-6 text-primary/20 translate-x-[-12px] translate-y-[12px]" />
              </div>
              <div className="flex flex-col gap-3 mb-8">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-text-secondary leading-none">{med.category}</span>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-success leading-none">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </div>
              </div>
              <h3 className="text-3xl font-black text-text-primary mb-4 tracking-tighter leading-none">{med.name}</h3>
              <p className="text-sm text-text-secondary mb-10 font-medium leading-relaxed line-clamp-3">
                {med.summary}
              </p>
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-primary border-t border-black/5 pt-6">
                <span>View Details</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>
 
      {/* Banned Drugs Promo Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="bg-gradient-to-br from-danger/5 to-surface/80 backdrop-blur-3xl p-12 md:p-24 rounded-[5rem] relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-danger/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-danger/5 rounded-full blur-[100px] -mr-48 -mt-48" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-20">
              <div>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-danger/10 text-danger text-[10px] font-black uppercase tracking-widest rounded-full mb-8 shadow-sm">
                  <AlertTriangle className="w-4 h-4" /> CDSCO ALERT
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-text-primary mb-6 tracking-[-0.04em] leading-[0.9]">Banned Drugs Registry</h2>
                <p className="text-xl text-danger/70 font-bold max-w-2xl leading-relaxed tracking-tight">
                  Search the official database of medications prohibited by CDSCO for manufacture and sale in India.
                </p>
              </div>
              <button 
                onClick={() => navigate('/banned-drugs')}
                className="bg-danger text-white px-12 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-[0_12px_24px_rgba(220,38,38,0.25)] active:scale-95 whitespace-nowrap"
              >
                Full Registry →
              </button>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURED_BANNED.map((drug, index) => (
                <div key={index} 
                  onClick={() => navigate('/banned-drugs')}
                  className="cursor-pointer relative overflow-hidden bg-white/80 dark:bg-surface/60 backdrop-blur-xl group p-8 md:p-10 rounded-[2.5rem] border border-danger/10 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(220,38,38,0.2)] hover:border-danger/30 transition-all duration-300 flex flex-col justify-between h-full"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-danger/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-danger/10 transition-colors" />
                  <div className="relative z-10 flex flex-col h-full flex-1">
                    <div className="flex-1">
                      <div className="w-12 h-12 bg-danger/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-danger/20">
                        <AlertTriangle className="w-5 h-5 text-danger" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-text-primary mb-3 leading-[1.1] tracking-tight">{drug.name}</h3>
                      <p className="text-[13px] text-danger/80 font-bold leading-relaxed">
                        {drug.reason}
                      </p>
                    </div>
                    
                    <div className="mt-8 flex items-center text-[10px] font-black uppercase tracking-widest text-text-secondary group-hover:text-danger transition-colors border-t border-danger/5 pt-5">
                      Read Detailed Report
                      <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
 
      {/* Discovery Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="bg-dark-bg rounded-[5rem] p-12 md:p-24 relative overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.2)]">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-primary/20 rounded-[1.5rem] flex items-center justify-center backdrop-blur-xl border border-white/5">
                  <Sparkles className="w-10 h-10 text-primary/60" />
                </div>
                <div>
                  <h2 className="text-5xl md:text-7xl font-black text-white tracking-[-0.04em] leading-[0.9] mb-4">Trending Scans</h2>
                  <p className="text-slate-400 font-medium text-xl tracking-tight">Based on real-time health queries in India</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {['Symptoms', 'Dosage', 'Safety', 'Alternatives'].map(cat => (
                  <button key={cat} className="px-6 py-3 rounded-full border border-white/10 text-slate-400 text-[11px] font-black uppercase tracking-widest hover:border-primary/50 hover:text-white hover:bg-white/10 transition-all bg-white/[0.03] backdrop-blur-md">
                    {cat}
                  </button>
                ))}
              </div>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {TRENDING_SEARCHES.map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -10, scale: 1.01 }}
                  onClick={() => navigate(item.path)}
                  className="bg-dark-surface/50 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden h-full"
                >
                   <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-0 group-hover:opacity-30 transition-opacity bg-primary`} />
                   
                  <div className="relative z-10 w-full mb-10 flex items-start justify-between">
                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border backdrop-blur-md ${item.accent.replace('bg-','bg-white/5 ').replace('border-','border-white/10 ').replace('text-blue-400', 'text-primary')}`}>
                      {item.type}
                    </span>
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-primary transition-all">
                      <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-all transform group-hover:translate-x-1.5" />
                    </div>
                  </div>
                  
                  <div className="relative z-10 mt-auto pt-6 border-t border-white/5">
                    <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors mb-3 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-base text-slate-400 font-medium group-hover:text-slate-300 transition-colors tracking-tight leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
 
      {/* FAQ Section */}
      <FAQ />
  
      {/* Disclaimer Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 mb-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="backdrop-blur-3xl bg-amber-50/60 border border-amber-200/50 p-16 md:p-28 rounded-[6rem] text-center shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full -mr-48 -mt-48 blur-[100px] opacity-50" />
          
          <div className="w-28 h-28 backdrop-blur-2xl bg-amber-500/10 rounded-[3rem] flex items-center justify-center mx-auto mb-12 relative z-10 border border-amber-200 shadow-sm transition-transform hover:rotate-12">
            <Shield className="w-14 h-14 text-amber-600" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black mb-10 tracking-[-0.04em] text-amber-950 relative z-10 uppercase">
             {t('medicalDisclaimer')}
          </h2>
          
          <div className="space-y-10 relative z-10 max-w-5xl mx-auto">
            <p className="text-3xl md:text-4xl text-amber-900/80 font-black leading-[1.1] tracking-tight">
              "{t('disclaimer')}"
            </p>
            <div className="w-40 h-2 bg-amber-200/50 mx-auto rounded-full" />
            <p className="text-xs md:text-sm font-black uppercase tracking-[0.4em] text-amber-700/60 max-w-3xl mx-auto leading-loose">
              {t('educationalDisclaimer')}
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
