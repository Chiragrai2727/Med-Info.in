import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../LanguageContext';
import { useToast } from '../ToastContext';
import { Search } from '../components/Search';
import { DiseaseGrid } from '../components/DiseaseGrid';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowRight, Sparkles, TrendingUp, Scale, Shield, ShieldCheck, Ban, Search as SearchIcon, Camera, CalendarClock, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCompare } from '../CompareContext';
import { CompareSearch } from '../components/CompareSearch';
import { FAQ } from '../components/FAQ';
import bannedDrugsData from '../data/banned_medicines.json';
import { useAuth } from '../AuthContext';

import { Logo } from '../components/Logo';

export const Home: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { addToCompare, removeFromCompare, compareList } = useCompare();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [bannedDrugs, setBannedDrugs] = useState<any[]>([]);
  const [bannedSearchQuery, setBannedSearchQuery] = useState('');

  const POPULAR_MEDS = [
    { name: 'Dolo 650', category: t('category_analgesic'), summary: t('doloSummary') },
    { name: 'Augmentin', category: t('category_antibiotic'), summary: t('augmentinSummary') },
    { name: 'Okacet', category: t('category_antihistamine'), summary: t('okacetSummary') },
    { name: 'Pan 40', category: t('category_antacid'), summary: t('pan40Summary') },
  ];

  const TRENDING_SEARCHES = [
    { title: 'Dolo 650 dosage', desc: 'Commonly searched for fever management', path: '/medicine/Dolo 650', type: 'Dosage', accent: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { title: 'Ibuprofen side effects', desc: 'Important safety information for pain relief', path: '/medicine/Ibuprofen', type: 'Safety', accent: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { title: 'Best medicine for dry cough', desc: 'Seasonal ailment query', path: '/medicine/Benadryl', type: 'Usage', accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { title: 'Antibiotics for throat infection', desc: 'Frequent bacterial infection query', path: '/medicine/Azithral 500', type: 'Safety', accent: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { title: 'Metformin uses', desc: 'Top searched for diabetes management', path: '/medicine/Metformin', type: 'Usage', accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { title: 'Amlodipine side effects', desc: 'Common blood pressure medication query', path: '/medicine/Amlodipine', type: 'Precaution', accent: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  ];

  const FEATURED_BANNED = [
    { name: 'Amidopyrine', reason: 'Agranulocytosis (severe drop in white blood cells)' },
    { name: 'Fixed dose combinations of vitamins', reason: 'Prohibited by CDSCO due to safety/efficacy concerns' },
    { name: 'Fixed dose combinations of Atropine', reason: 'Prohibited by CDSCO due to safety/efficacy concerns' },
    { name: 'FDC of Strychnine and Caffeine', reason: 'Prohibited by CDSCO due to safety/efficacy concerns' },
  ];

  useEffect(() => {
    // Load top 4 banned drugs for highlight
    setBannedDrugs(bannedDrugsData.slice(0, 4));
  }, []);

  const filteredBannedHighlight = bannedDrugsData
    .filter(drug => drug.drug_name.toLowerCase().includes(bannedSearchQuery.toLowerCase()))
    .slice(0, 4);

  const handleFeatureClick = (path: string) => {
    if (user || path === '/banned-drugs' || path === '/generics') {
      navigate(path);
    } else {
      showToast('Please sign in to use this feature', 'info');
      openAuthModal();
    }
  };

  return (
    <div className="min-h-screen pt-40 pb-20 bg-transparent">
      <Helmet>
        <title>{t('appName')} - Medical AI Scanner & CDSCO Banned List</title>
        <meta name="description" content={t('heroDescription')} />
        <meta name="keywords" content="medicine scanner, CDSCO banned drugs India, dolo 650 uses, medical AI, pharmaceutical intelligence, check banned medicines" />
        <link rel="canonical" href="https://aethelcare.xyz" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "${t('appName')}",
              "operatingSystem": "Web, Android, iOS",
              "applicationCategory": "MedicalApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR"
              },
              "description": "${t('heroDescription')}"
            }
          `}
        </script>
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
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {[
              { icon: Sparkles, text: 'AI Intelligence', color: 'text-blue-600 bg-white/60 border-white/80' },
              { icon: ShieldCheck, text: 'CDSCO Verified', color: 'text-emerald-600 bg-white/60 border-white/80' },
              { icon: Shield, text: 'Privacy Protected', color: 'text-slate-600 bg-white/60 border-white/80' },
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
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 mb-8 tracking-[-0.05em] max-w-6xl mx-auto leading-[0.85] sm:leading-[0.9]">
            Check if your medicine is banned in India
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-500 mb-14 max-w-3xl mx-auto font-medium leading-relaxed tracking-tight">
            The simplest way to understand your medicines and safety.
          </p>
          
          <div className="mb-14 relative max-w-2xl mx-auto z-40">
            <div className="backdrop-blur-3xl bg-white/80 p-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white/40">
              <Search 
                autoFocus 
                placeholder="Search any medicine name..."
              />
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-5">
              <button 
                onClick={() => navigate('/banned-drugs')}
                className="px-10 py-4 bg-red-600 text-white rounded-[1.5rem] font-bold hover:bg-red-700 transition-all shadow-[0_12px_24px_rgba(220,38,38,0.3)] active:scale-95 text-sm uppercase tracking-widest"
              >
                Check Banned List
              </button>
              <button 
                onClick={() => navigate('/scan')}
                className="px-10 py-4 backdrop-blur-xl bg-white/60 text-slate-900 border border-white/80 rounded-[1.5rem] font-bold hover:bg-white transition-all shadow-[0_8px_32px_rgba(0,0,0,0.05)] active:scale-95 text-sm uppercase tracking-widest"
              >
                Scan Free
              </button>
            </div>
          </div>
 
          <div className="flex flex-wrap justify-center gap-3 items-center">
            {['Dolo 650', 'Pan-D', 'Combiflam', 'Azithral 500', 'Calpol'].map((q) => (
              <button
                key={q}
                onClick={() => navigate(`/medicine/${encodeURIComponent(q)}`)}
                className="px-5 py-2.5 backdrop-blur-md bg-white/40 border border-white/60 rounded-full text-xs font-bold text-slate-600 hover:bg-white hover:border-slate-400 transition-all shadow-sm"
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
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Popular Medicines</h2>
          <div className="h-px bg-slate-200 flex-1 mx-8 hidden md:block opacity-30" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {POPULAR_MEDS.map((med, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => navigate(`/medicine/${encodeURIComponent(med.name)}`)}
              className="p-10 backdrop-blur-xl bg-white/80 rounded-[3rem] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-blue-50/50 rounded-full -mr-10 -mt-10 flex items-center justify-center transition-transform group-hover:scale-110">
                <HelpCircle className="w-6 h-6 text-blue-200 translate-x-[-12px] translate-y-[12px]" />
              </div>
              <div className="flex flex-col gap-3 mb-8">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 leading-none">{med.category}</span>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 leading-none">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter leading-none">{med.name}</h3>
              <p className="text-sm text-slate-500 mb-10 font-medium leading-relaxed line-clamp-3">
                {med.summary}
              </p>
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 border-t border-black/5 pt-6">
                <span>View Details</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>
 
      {/* Banned Drugs Promo Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="bg-gradient-to-br from-rose-50/80 to-white/80 backdrop-blur-3xl p-12 md:p-24 rounded-[5rem] relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-rose-100/50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-200/20 rounded-full blur-[100px] -mr-48 -mt-48" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-20">
              <div>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-8 shadow-sm">
                  <AlertTriangle className="w-4 h-4" /> CDSCO ALERT
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-[-0.04em] leading-[0.9]">Banned Drugs Registry</h2>
                <p className="text-xl text-rose-900/70 font-bold max-w-2xl leading-relaxed tracking-tight">
                  Search the official database of medications prohibited by CDSCO for manufacture and sale in India.
                </p>
              </div>
              <button 
                onClick={() => navigate('/banned-drugs')}
                className="bg-red-600 text-white px-12 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all shadow-[0_12px_24px_rgba(220,38,38,0.25)] active:scale-95 whitespace-nowrap"
              >
                Full Registry →
              </button>
            </div>
 
            <div className="mb-20 relative max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none">
                <SearchIcon className="h-6 w-6 text-rose-400" />
              </div>
              <input
                type="text"
                placeholder="Search banned drug name..."
                onChange={(e) => {
                  if (e.target.value.length > 2) {
                    navigate(`/banned-drugs?q=${encodeURIComponent(e.target.value)}`);
                  }
                }}
                className="w-full pl-16 pr-8 py-6 bg-white/80 backdrop-blur-xl border border-rose-200/50 rounded-[2.5rem] text-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.03)] font-medium placeholder-rose-200"
              />
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURED_BANNED.map((drug, index) => (
                <div key={index} className="backdrop-blur-xl bg-white/60 p-10 rounded-[3rem] border border-white shadow-sm hover:shadow-xl transition-all group">
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-8 border border-rose-100">
                    <AlertTriangle className="w-6 h-6 text-rose-500" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 leading-none uppercase tracking-tighter">{drug.name}</h3>
                  <p className="text-sm text-red-600 font-bold leading-relaxed mb-8">
                    {drug.reason}
                  </p>
                  <button 
                    onClick={() => navigate('/banned-drugs')}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-600 transition-colors border-t border-black/5 pt-4 w-full text-left"
                  >
                    Read Detailed Report →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
 
      {/* Discovery Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="bg-[#0B1729] rounded-[5rem] p-12 md:p-24 relative overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.2)]">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-blue-600/20 rounded-[1.5rem] flex items-center justify-center backdrop-blur-xl border border-white/5">
                  <Sparkles className="w-10 h-10 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-5xl md:text-7xl font-black text-white tracking-[-0.04em] leading-[0.9] mb-4">Trending Scans</h2>
                  <p className="text-slate-400 font-medium text-xl tracking-tight">Based on real-time health queries in India</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {['Symptoms', 'Dosage', 'Safety', 'Alternatives'].map(cat => (
                  <button key={cat} className="px-6 py-3 rounded-full border border-white/10 text-slate-400 text-[11px] font-black uppercase tracking-widest hover:border-blue-500/50 hover:text-white hover:bg-white/10 transition-all bg-white/[0.03] backdrop-blur-md">
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
                  className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden h-full"
                >
                   <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-0 group-hover:opacity-30 transition-opacity bg-blue-500`} />
                   
                  <div className="relative z-10 w-full mb-10 flex items-start justify-between">
                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border backdrop-blur-md ${item.accent.replace('bg-','bg-white/5 ').replace('border-','border-white/10 ')}`}>
                      {item.type}
                    </span>
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-all">
                      <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-all transform group-hover:translate-x-1.5" />
                    </div>
                  </div>
                  
                  <div className="relative z-10 mt-auto pt-6 border-t border-white/5">
                    <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors mb-3 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-base text-slate-500 font-medium group-hover:text-slate-400 transition-colors tracking-tight leading-relaxed">
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

