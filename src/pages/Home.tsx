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
    <div className="min-h-screen pt-40 pb-20 bg-white">
      <Helmet>
        <title>{t('appName')} - Medical AI Scanner</title>
        <meta name="description" content={t('heroDescription')} />
        <link rel="canonical" href="https://aethelcare.xyz" />
      </Helmet>

      {/* Hero Section */}
      <section className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-12 2xl:px-24 text-center mb-20 relative z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex flex-col items-center mb-12">
            <div className="2xl:hidden">
              <Logo size="xl" className="mb-8" />
            </div>
            <div className="hidden 2xl:block">
              <Logo size="xl" className="mb-8 scale-150" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl 2xl:text-9xl font-extrabold text-slate-900 mb-6 tracking-tight max-w-6xl mx-auto leading-tight">
            Check if your medicine is banned in India
          </h1>
          
          <p className="text-xl md:text-2xl 2xl:text-5xl text-slate-600 mb-10 max-w-3xl 2xl:max-w-7xl mx-auto font-medium leading-relaxed">
            The simplest way to understand your medicines and safety.
          </p>
          
          <div className="mb-10 relative max-w-2xl 2xl:max-w-5xl mx-auto z-40">
            <Search 
              autoFocus 
              placeholder="Search any medicine name..."
            />
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => navigate('/banned-drugs')}
                className="px-8 py-3 2xl:px-16 2xl:py-8 2xl:text-3xl bg-red-600 text-white rounded-xl 2xl:rounded-3xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                Check Banned List
              </button>
              <button 
                onClick={() => navigate('/scan')}
                className="px-8 py-3 2xl:px-16 2xl:py-8 2xl:text-3xl bg-white text-slate-900 border-2 border-slate-200 rounded-xl 2xl:rounded-3xl font-bold hover:border-blue-500 hover:text-blue-600 transition-all"
              >
                Search Free
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 items-center">
            {['Dolo 650', 'Pan-D', 'Combiflam', 'Azithral 500', 'Calpol'].map((q) => (
              <button
                key={q}
                onClick={() => navigate(`/medicine/${encodeURIComponent(q)}`)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-white hover:border-slate-400 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Popular Medicines Section */}
      <section className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-12 2xl:px-24 mb-24">
        <h2 className="text-3xl 2xl:text-6xl font-black text-slate-900 mb-10 tracking-tight">Popular Medicines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 2xl:gap-12">
          {POPULAR_MEDS.map((med, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -10 }}
              onClick={() => navigate(`/medicine/${encodeURIComponent(med.name)}`)}
              className="p-8 2xl:p-16 bg-white rounded-[2.5rem] 2xl:rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 2xl:w-48 2xl:h-48 bg-slate-50 rounded-full -mr-8 -mt-8 2xl:-mr-16 2xl:-mt-16 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 2xl:w-10 h-10 text-slate-200 translate-x-[-8px] translate-y-[8px]" />
              </div>
              <div className="flex flex-col gap-2 mb-6">
                <span className="text-[10px] 2xl:text-lg font-black uppercase tracking-[0.2em] text-slate-400">{med.category}</span>
                <div className="flex items-center gap-1.5 text-[9px] 2xl:text-lg font-black uppercase tracking-widest text-green-600">
                  <ShieldCheck className="w-3 h-3 2xl:w-6 h-6" /> Drug Verified
                </div>
              </div>
              <h3 className="text-2xl 2xl:text-5xl font-black text-slate-900 mb-3 tracking-tighter leading-none">{med.name}</h3>
              <p className="text-sm 2xl:text-2xl text-slate-500 mb-8 font-medium leading-relaxed line-clamp-2">
                {med.summary}
              </p>
              <div className="flex items-center justify-between text-[10px] 2xl:text-lg font-black uppercase tracking-[0.2em] text-blue-600">
                <span>View Details</span>
                <ArrowRight className="w-4 h-4 2xl:w-8 h-8 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Banned Drugs Promo Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-10 md:p-20 rounded-[4rem] relative overflow-hidden shadow-sm border border-rose-100">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-6">
                  <AlertTriangle className="w-4 h-4" /> CDSCO ALERT
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">Banned Drugs Search</h2>
                <p className="text-lg text-rose-800 font-bold max-w-xl">
                  Quickly check if a medication is prohibited for manufacture and sale in India.
                </p>
              </div>
              <button 
                onClick={() => navigate('/banned-drugs')}
                className="bg-red-600 text-white px-10 py-5 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-95"
              >
                Full Registry →
              </button>
            </div>

            <div className="mb-16 relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-rose-400" />
              </div>
              <input
                type="text"
                placeholder="Search banned drug name..."
                onChange={(e) => {
                  if (e.target.value.length > 2) {
                    navigate(`/banned-drugs?q=${encodeURIComponent(e.target.value)}`);
                  }
                }}
                className="w-full pl-14 pr-6 py-5 bg-white border border-rose-200 rounded-3xl text-lg focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all shadow-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURED_BANNED.map((drug, index) => (
                <div key={index} className="bg-white p-8 rounded-[2.5rem] border border-rose-100 shadow-sm hover:shadow-lg transition-all group">
                  <AlertTriangle className="w-6 h-6 text-rose-400 mb-6" />
                  <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight uppercase tracking-tight">{drug.name}</h3>
                  <p className="text-sm text-red-600 font-bold leading-relaxed mb-6">
                    {drug.reason}
                  </p>
                  <button 
                    onClick={() => navigate('/banned-drugs')}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-600 transition-colors"
                  >
                    Read Why →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Discovery Section (People also search for) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="bg-[#0B1729] rounded-[4rem] p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-slate-950/50">
          {/* Subtle Background Glows */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-3">People also search for</h2>
                  <p className="text-slate-400 font-medium text-lg">Based on current health trends and CDSCO guidelines</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {['Symptoms', 'Dosage', 'Safety', 'Alternatives'].map(cat => (
                  <button key={cat} className="px-5 py-2.5 rounded-full border border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-blue-500/50 hover:text-white hover:bg-white/5 transition-all bg-white/[0.02]">
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {TRENDING_SEARCHES.map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -6 }}
                  onClick={() => navigate(item.path)}
                  className="bg-[#0F1E35]/50 border border-white/5 p-8 rounded-[2.5rem] transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                >
                   {/* Bloom Hover Effect */}
                   <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity bg-current ${item.accent.split(' ')[0]}`} />
                   
                  <div className="relative z-10 w-full mb-6 flex items-start justify-between">
                    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${item.accent}`}>
                      {item.type}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-white transition-all transform group-hover:translate-x-2" />
                  </div>
                  
                  <div className="relative z-10 mt-auto">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium group-hover:text-slate-400 transition-colors">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-amber-50 border-2 border-amber-200 p-12 md:p-20 rounded-[4rem] text-center shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-300/10 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />
          
          <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 relative z-10 border border-amber-200 shadow-inner">
            <Shield className="w-12 h-12 text-amber-600" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black mb-8 tracking-tighter text-amber-900 relative z-10 flex items-center justify-center gap-3">
             {t('medicalDisclaimer')}
          </h2>
          
          <div className="space-y-8 relative z-10 max-w-5xl mx-auto">
            <p className="text-2xl md:text-3xl text-amber-800 font-bold leading-tight tracking-tight">
              "{t('disclaimer')}"
            </p>
            <div className="w-32 h-1.5 bg-amber-200 mx-auto rounded-full opacity-50" />
            <p className="text-xs md:text-sm font-black uppercase tracking-[0.4em] text-amber-600/60 max-w-2xl mx-auto leading-loose">
              {t('educationalDisclaimer')}
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

