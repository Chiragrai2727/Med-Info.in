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
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const filteredDrugs = useMemo(() => {
    if (!searchQuery.trim()) return bannedDrugsData.slice(0, 50);
    const query = searchQuery.toLowerCase();
    return bannedDrugsData.filter(drug => 
      drug.drug_name.toLowerCase().includes(query) ||
      drug.side_effects_serious.some(se => se.toLowerCase().includes(query)) ||
      (drug.drug_class && drug.drug_class.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const recentlyBanned = useMemo(() => bannedDrugsData.slice(0, 3), []);

  const handleWhatsAppShare = (drug: BannedDrug) => {
    const reason = drug.side_effects_serious[0] || drug.quick_summary;
    const message = `⚠️ WARNING: ${drug.drug_name} is BANNED in India by CDSCO. Reason: ${reason}. Check if your medicines are safe: https://aethelcare.xyz/banned-drugs`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const isNotFound = searchQuery.trim().length > 2 && filteredDrugs.length === 0;
  const isFound = searchQuery.trim().length > 0 && filteredDrugs.length > 0;

  return (
    <div className="min-h-screen pt-40 pb-20 bg-[#FAFAFA] pt-[calc(10rem+env(safe-area-inset-top))]">
      <Helmet>
        <title>Banned Medicines in India 2026 — CDSCO Banned Drug List | Aethelcare</title>
        <meta name="description" content="Check if your medicine is banned in India. Search 300+ CDSCO-banned drugs instantly. Updated monthly. Free to use." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 font-medium">
          <ChevronLeft className="w-4 h-4" />
          {t('backToHome')}
        </Link>

        {/* Page Header */}
        <div className="bg-red-600 text-white p-10 md:p-16 rounded-[4rem] relative overflow-hidden mb-16 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6 backdrop-blur-md">
              <ShieldAlert className="w-4 h-4" /> {t('officialCDSCOData')}
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">{t('bannedDrugsRegistry')}</h1>
            <div className="space-y-2 mb-8">
              <p className="text-xl md:text-2xl text-red-100 font-medium max-w-3xl leading-relaxed">
                Updated with latest CDSCO notifications • {bannedDrugsData.length} medicines currently banned in India
              </p>
              <div className="flex items-center gap-2 text-red-200 text-sm font-bold uppercase tracking-widest">
                Source: <a href="https://cdsco.gov.in" target="_blank" rel="noreferrer" className="underline hover:text-white flex items-center gap-1">CDSCO.gov.in <ExternalLink className="w-3 h-3" /></a>
              </div>
            </div>
            <button 
              onClick={() => {
                const el = document.getElementById('full-registry');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-red-600 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-50 transition-all shadow-xl active:scale-95"
            >
              See all {bannedDrugsData.length} banned medicines in India →
            </button>
          </div>
        </div>

        {/* Recently Banned Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gray-200" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Recently Banned Alerts</h2>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentlyBanned.map((drug) => (
              <motion.div 
                key={`recent-${drug.id}`}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-[2.5rem] border-2 border-red-50 shadow-sm relative overflow-hidden group"
              >
                <div className="absolute top-4 right-4 px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg z-10">
                  NEW
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2 pr-12">{drug.drug_name}</h3>
                <p className="text-sm text-red-600 font-bold mb-4 line-clamp-2">{drug.side_effects_serious[0]}</p>
                <button 
                   onClick={() => handleWhatsAppShare(drug)}
                   className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-colors"
                >
                   <Share2 className="w-3.5 h-3.5" /> Warn a friend
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Search Improvements */}
        <div className="mb-12 relative" id="search-section">
          <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine name, brand, or salt composition..."
            className="block w-full pl-20 pr-8 py-8 bg-white border-2 border-gray-100 rounded-[3rem] text-xl focus:ring-8 focus:ring-red-500/5 focus:border-red-500 transition-all shadow-sm font-medium placeholder:text-gray-300"
          />
          
          <AnimatePresence>
            {isNotFound && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-6 bg-green-50 border-2 border-green-200 rounded-[2rem] flex items-center gap-4 text-green-800"
              >
                <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-lg font-black tracking-tight">✓ {searchQuery} is not banned in India</p>
                  <p className="text-sm font-medium opacity-80">This medicine is not in the current CDSCO prohibited list as of April 2026.</p>
                </div>
              </motion.div>
            )}

            {isFound && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex items-center gap-2 px-6 text-red-600 font-bold uppercase tracking-widest text-[10px]"
              >
                <AlertTriangle className="w-4 h-4" /> Matched {filteredDrugs.length} banned results
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Banned Drug Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="full-registry">
          {filteredDrugs.map((drug, index) => (
            <motion.div
              key={drug.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
              className={`bg-white rounded-[3rem] border-2 transition-all shadow-sm flex flex-col group relative overflow-hidden ${
                expandedId === drug.id ? 'border-red-400 ring-4 ring-red-500/5' : 'border-gray-100 hover:border-red-200 hover:shadow-xl'
              }`}
            >
              <div className="p-8 pb-4">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                    <Ban className="w-7 h-7 text-red-600 group-hover:text-white" />
                  </div>
                  <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                    BANNED BY CDSCO
                  </span>
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter leading-none">{drug.drug_name}</h3>
                
                <div className="mb-6 space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Primary Health Risk</p>
                    <p className="text-red-600 font-bold leading-relaxed">
                      {drug.side_effects_serious.join(', ')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Notice Summary</p>
                    <p className="text-gray-600 font-medium text-sm leading-relaxed">
                      {drug.quick_summary}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setExpandedId(expandedId === drug.id ? null : drug.id)}
                  className="w-full flex items-center justify-between py-4 border-t border-gray-50 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors"
                >
                  {expandedId === drug.id ? 'Hide Details' : 'Why it was banned →'}
                  {expandedId === drug.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {expandedId === drug.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-red-50 pt-6 pb-2"
                    >
                      <div className="bg-red-50/50 p-5 rounded-2xl space-y-4">
                        <div className="flex items-start gap-3">
                          <ShieldAlert className="w-5 h-5 text-red-600 mt-1 shrink-0" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-900 mb-1">Gazette Notification</p>
                            <p className="text-sm font-bold text-red-700">Ref: CDSCO/BANNED/${drug.id.toUpperCase()}</p>
                            <p className="text-xs font-medium text-red-600 mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Updated: 14 Oct 2025</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-1 shrink-0" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-900 mb-1">Health Explanation</p>
                            <p className="text-sm font-medium text-red-800 leading-relaxed">
                              This substance was found to have an unfavorable risk-benefit ratio for human use under the clinical trials and rules of the Drugs and Cosmetics Act. Prohibited for manufacture, sale, and distribution across India.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-auto p-4 bg-gray-50/50 flex gap-2">
                 <button 
                  onClick={() => handleWhatsAppShare(drug)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg active:scale-95"
                 >
                   <Share2 className="w-4 h-4" /> Warn a friend →
                 </button>
                 <button 
                   onClick={() => navigate(`/medicine/${encodeURIComponent(drug.drug_name)}`)}
                   className="w-14 h-14 bg-white border border-gray-200 text-gray-400 rounded-2xl flex items-center justify-center hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                 >
                   <ArrowRight className="w-5 h-5" />
                 </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Global Empty State */}
        {searchQuery.trim().length > 0 && searchQuery.trim().length <= 2 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Keep typing...</h3>
            <p className="text-gray-500 font-medium text-lg">Enter at least 3 characters to search the registry.</p>
          </div>
        )}
      </div>
    </div>
  );
};
