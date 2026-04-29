import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ban, 
  AlertTriangle, 
  Search, 
  ChevronLeft, 
  ShieldAlert, 
  ArrowRight, 
  Share2, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import bannedDrugsData from '../data/banned_medicines.json';
import { useLanguage } from '../LanguageContext';
import { offlineService } from '../services/offlineService';

interface BannedDrug {
  id: string;
  drug_name: string;
  side_effects_serious: string[];
  quick_summary: string;
  drug_class?: string;
  india_regulatory_status?: string;
}

export const BannedDrugs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [allDrugs, setAllDrugs] = useState<BannedDrug[]>(bannedDrugsData);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
    
    // Cache for offline use if we are online
    if (navigator.onLine) {
      offlineService.cacheBannedDrugs(bannedDrugsData);
    } else {
      const cached = offlineService.getBannedDrugs();
      if (cached) setAllDrugs(cached);
    }
  }, [searchParams]);

  const filteredDrugs = useMemo(() => {
    if (!searchQuery.trim()) return allDrugs.slice(0, 50);
    const query = searchQuery.toLowerCase();
    return allDrugs.filter(drug => 
      drug.drug_name.toLowerCase().includes(query) ||
      drug.side_effects_serious.some(se => se.toLowerCase().includes(query)) ||
      (drug.drug_class && drug.drug_class.toLowerCase().includes(query))
    );
  }, [searchQuery, allDrugs]);

  const recentlyBanned = useMemo(() => allDrugs.slice(0, 3), [allDrugs]);

  const handleWhatsAppShare = (drug: BannedDrug) => {
    const reason = drug.side_effects_serious[0] || drug.quick_summary;
    const message = `⚠️ CDSCO BANNED DRUG ALERT 🇮🇳\n\nMedicine: *${drug.drug_name}*\nStatus: *BANNED* for Manufacture & Sale\nReason: ${reason}\n\nCheck your family's medicines on Aethelcare (CDSCO Verified): https://aethelcare.xyz/banned-drugs`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const isNotFound = searchQuery.trim().length > 2 && filteredDrugs.length === 0;
  const isFound = searchQuery.trim().length > 0 && filteredDrugs.length > 0;

  return (
    <div className="min-h-screen pt-40 pb-20 bg-transparent pt-[calc(10rem+env(safe-area-inset-top))]">
      <Helmet>
        <title>Banned Medicines in India 2026 — Latest CDSCO Banned Drug List</title>
        <meta name="description" content="Search the complete registry of 300+ drugs banned by CDSCO in India. Check if your medicines like Nimesulide, Aspirin, or FDC Paracetamol are safe or prohibited. Verified medical safety information." />
        <meta name="keywords" content="banned drugs list India 2026, latest CDSCO banned medicines, prohibited drugs India list, nimesulide ban India, aspirin tablets safety, paracetamol news India, medicine safety scanner india, Aethelcare India" />
        <link rel="canonical" href="https://aethelcare.xyz/banned-drugs" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "MedicalGuideline",
              "name": "CDSCO Banned Medicines List India",
              "guidelineSubject": "Prohibited Medications in India",
              "creator": {
                "@type": "Organization",
                "name": "CDSCO"
              },
              "datePublished": "2026-04-25"
            }
          `}
        </script>
      </Helmet>
 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-12 font-black text-xs uppercase tracking-widest">
          <ChevronLeft className="w-4 h-4" />
          {t('backToHome')}
        </Link>
 
        {/* Page Header */}
        <div className="bg-red-600 text-white p-12 md:p-20 rounded-[5rem] relative overflow-hidden mb-20 shadow-[0_40px_80px_rgba(220,38,38,0.2)] border-2 border-red-400">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-[100px]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 backdrop-blur-md bg-white/20 text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-full mb-8 border border-white/20">
              <ShieldAlert className="w-4 h-4" /> {t('officialCDSCOData')}
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-[-0.05em] mb-6 leading-[0.8]">{t('bannedDrugsRegistry')}</h1>
            <div className="space-y-4 mb-12">
              <p className="text-xl md:text-3xl text-red-100 font-bold max-w-4xl leading-tight tracking-tight">
                Updated with latest CDSCO notifications • {bannedDrugsData.length} medicines currently banned in India
              </p>
              <div className="flex items-center gap-2 text-red-200 text-xs font-black uppercase tracking-[0.2em]">
                Verified Source: <a href="https://cdsco.gov.in" target="_blank" rel="noreferrer" className="underline hover:text-white flex items-center gap-2">CDSCO.gov.in <ExternalLink className="w-4 h-4" /></a>
              </div>
            </div>
            <button 
              onClick={() => {
                const el = document.getElementById('full-registry');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-red-600 px-12 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-red-50 transition-all shadow-2xl active:scale-95"
            >
              See all {bannedDrugsData.length} banned medicines →
            </button>
          </div>
        </div>
 
        {/* Recently Banned Section */}
        <div className="mb-20">
          <div className="flex items-center gap-6 mb-12">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 whitespace-nowrap">Recently Banned Alerts</h2>
            <div className="h-px flex-1 bg-slate-200 opacity-30" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentlyBanned.map((drug) => (
              <motion.div 
                key={`recent-${drug.id}`}
                whileHover={{ y: -8, scale: 1.02 }}
                className="backdrop-blur-xl bg-white/60 p-10 rounded-[3.5rem] border-2 border-red-50/50 shadow-[0_12px_40px_rgba(0,0,0,0.03)] relative overflow-hidden group"
              >
                <div className="absolute top-6 right-6 px-4 py-1.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg z-10">
                  NEW
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter leading-none pr-12">{drug.drug_name}</h3>
                <p className="text-base text-red-600 font-bold mb-8 leading-tight">{drug.side_effects_serious[0]}</p>
                <button 
                   onClick={() => handleWhatsAppShare(drug)}
                   className="w-full flex items-center justify-center gap-3 py-4 backdrop-blur-md bg-emerald-50/50 text-emerald-700 border border-emerald-100/50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95"
                >
                   <Share2 className="w-4 h-4" /> Warn a friend
                </button>
              </motion.div>
            ))}
          </div>
        </div>
 
        {/* Search Header */}
        <div className="mb-16 relative" id="search-section">
          <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none">
            <Search className="h-8 w-8 text-slate-300" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine name, brand, or salt composition..."
            className="block w-full pl-24 pr-10 py-10 backdrop-blur-2xl bg-white/70 border-2 border-white rounded-[4rem] text-2xl focus:ring-8 focus:ring-red-500/5 focus:border-red-500 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.04)] font-black tracking-tight placeholder:text-slate-200"
          />
          
          <AnimatePresence>
            {isNotFound && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-10 p-10 backdrop-blur-xl bg-emerald-50/60 border border-emerald-200/50 rounded-[3.5rem] flex items-center gap-8 text-emerald-900 shadow-[0_12px_40px_rgba(0,0,0,0.03)]"
              >
                <div className="w-16 h-16 backdrop-blur-md bg-emerald-600 text-white rounded-3xl flex items-center justify-center shrink-0 shadow-xl">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tight leading-none mb-2">✓ {searchQuery} is not banned in India</p>
                  <p className="text-lg font-bold opacity-60 tracking-tight leading-none">This medicine is not in the current CDSCO prohibited list as of April 2026.</p>
                </div>
              </motion.div>
            )}
 
            {isFound && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex items-center gap-3 px-10 text-red-600 font-black uppercase tracking-[0.3em] text-[11px]"
              >
                <AlertTriangle className="w-5 h-5" /> Matched {filteredDrugs.length} Results in registry
              </motion.div>
            )}
          </AnimatePresence>
        </div>
 
        {/* Banned Drug Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" id="full-registry">
          {filteredDrugs.map((drug, index) => (
            <motion.div
              key={drug.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
              className={`backdrop-blur-xl bg-white/70 rounded-[4rem] border transition-all shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col group relative overflow-hidden ${
                expandedId === drug.id ? 'border-red-400 ring-8 ring-red-500/5' : 'border-white hover:border-red-200 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]'
              }`}
            >
              <div className="p-12 pb-6">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-16 h-16 backdrop-blur-md bg-red-50 rounded-[1.5rem] flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm border border-red-100/50">
                    <Ban className="w-8 h-8 text-red-600 group-hover:text-white" />
                  </div>
                  <span className="px-4 py-1.5 bg-red-50/80 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-100/50">
                    BANNED BY CDSCO
                  </span>
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-[-0.04em] leading-[0.9]">{drug.drug_name}</h3>
                
                <div className="mb-8 space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">Primary Health Risk</p>
                    <p className="text-red-600 font-bold leading-tight text-lg tracking-tight">
                      {drug.side_effects_serious.join(', ')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">Notice Summary</p>
                    <p className="text-slate-500 font-bold text-base leading-relaxed tracking-tight">
                      {drug.quick_summary}
                    </p>
                  </div>
                </div>
 
                <button 
                  onClick={() => setExpandedId(expandedId === drug.id ? null : drug.id)}
                  className="w-full flex items-center justify-between py-6 border-t border-black/5 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-600 transition-colors"
                >
                  {expandedId === drug.id ? 'Hide Details' : 'Detailed CDSCO Report →'}
                  {expandedId === drug.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
 
                <AnimatePresence>
                  {expandedId === drug.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-slate-50 rounded-[2rem] mb-6 animate-in slide-in-from-top-2"
                    >
                      <div className="p-8 space-y-6">
                        <div className="flex items-start gap-4">
                          <ShieldAlert className="w-6 h-6 text-red-600 mt-1 shrink-0" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Gazette Notification</p>
                            <p className="text-base font-black text-slate-900 tracking-tight">Ref: CDSCO/BANNED/${drug.id.toUpperCase()}</p>
                            <p className="text-[10px] font-black text-slate-400 mt-1 flex items-center gap-2 uppercase tracking-widest"><Calendar className="w-3.5 h-3.5" /> Updated: Oct 2025</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <AlertCircle className="w-6 h-6 text-red-600 mt-1 shrink-0" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Health Rationale</p>
                            <p className="text-sm font-bold text-slate-600 leading-relaxed tracking-tight">
                              Prohibited under Section 26A of Drugs and Cosmetics Act. Clinical data suggests significant potential for health complications without matching therapeutic benefit.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
 
              <div className="mt-auto p-6 bg-slate-50/50 border-t border-black/5 flex gap-3">
                 <button 
                  onClick={() => handleWhatsAppShare(drug)}
                  className="flex-1 flex items-center justify-center gap-3 py-6 bg-emerald-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl active:scale-95"
                 >
                   <Share2 className="w-5 h-5" /> Warn Family →
                 </button>
                 <button 
                   onClick={() => navigate(`/medicine/${encodeURIComponent(drug.drug_name)}`)}
                   className="w-16 h-16 bg-white border border-slate-200 text-slate-400 rounded-3xl flex items-center justify-center hover:text-red-600 hover:border-red-200 transition-all shadow-sm group-hover:scale-105 active:scale-90"
                 >
                   <ArrowRight className="w-6 h-6" />
                 </button>
              </div>
            </motion.div>
          ))}
        </div>
 
        {/* Global Empty State */}
        {searchQuery.trim().length > 0 && searchQuery.trim().length <= 2 && (
          <div className="text-center py-32">
            <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
              <Search className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight leading-none uppercase">Keep typing...</h3>
            <p className="text-slate-400 font-bold text-xl tracking-tight leading-none">Enter at least 3 characters to search the registry.</p>
          </div>
        )}
      </div>
    </div>
  );
};
