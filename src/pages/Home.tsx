import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { useToast } from '../ToastContext';
import { Search } from '../components/Search';
import { DiseaseGrid } from '../components/DiseaseGrid';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowRight, Sparkles, TrendingUp, Scale, Shield, ShieldCheck, Ban, Search as SearchIcon, Camera, CalendarClock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCompare } from '../CompareContext';
import { CompareSearch } from '../components/CompareSearch';
import bannedDrugsData from '../data/banned_medicines.json';
import { useAuth } from '../AuthContext';

const POPULAR_MEDS = [
  { name: 'Dolo 650', category: 'Analgesic', summary: 'India\'s most trusted medicine for fever and body pain relief.' },
  { name: 'Augmentin', category: 'Antibiotic', summary: 'Powerful broad-spectrum antibiotic for various bacterial infections.' },
  { name: 'Okacet', category: 'Antihistamine', summary: 'Quick relief from allergies, sneezing, and skin itching.' },
  { name: 'Pan 40', category: 'Antacid', summary: 'Effective long-lasting relief from acidity and heartburn.' },
];

const SUGGESTED_QUERIES = ['Fever', 'Headache', 'Cold & cough', 'Paracetamol vs Ibuprofen'];

const PEOPLE_ALSO_SEARCH = [
  { query: 'Dolo 650 dosage', reason: 'Commonly searched for fever management' },
  { query: 'Ibuprofen side effects', reason: 'Important safety information for pain relief' },
  { query: 'Best medicine for dry cough', reason: 'Seasonal ailment query' },
  { query: 'Antibiotics for throat infection', reason: 'Frequent bacterial infection query' },
  { query: 'Metformin uses', reason: 'Top searched for diabetes management' },
  { query: 'Amlodipine side effects', reason: 'Common blood pressure medication query' }
];

import { Logo } from '../components/Logo';

export const Home: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { addToCompare, removeFromCompare, compareList } = useCompare();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [bannedDrugs, setBannedDrugs] = useState<any[]>([]);
  const [bannedSearchQuery, setBannedSearchQuery] = useState('');

  useEffect(() => {
    // Load top 4 banned drugs for highlight
    setBannedDrugs(bannedDrugsData.slice(0, 4));
  }, []);

  const filteredBannedHighlight = bannedDrugsData
    .filter(drug => drug.drug_name.toLowerCase().includes(bannedSearchQuery.toLowerCase()))
    .slice(0, 4);

  const handleFeatureClick = (path: string) => {
    if (user) {
      navigate(path);
    } else {
      showToast('Please sign in to use this feature', 'info');
      openAuthModal();
    }
  };

  return (
    <div className="min-h-screen pt-40 pb-20 bg-[#FAFAFA] pt-[calc(10rem+env(safe-area-inset-top))]">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col items-center mb-16">
            <Logo size="xl" className="mb-10" />
            <div className="flex flex-wrap justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white shadow-sm border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> {t('appName')}
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white shadow-sm border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-green-600">
                <Shield className="w-3.5 h-3.5" /> Privacy First
              </div>
            </div>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-black mb-10 leading-[0.9] max-w-5xl mx-auto">
            Your Health,<br />
            <span className="text-gray-300">Decoded.</span>
          </h1>
          
          <p className="text-2xl text-gray-400 mb-16 max-w-2xl mx-auto font-medium tracking-tight">
            The most reliable, privacy-first medicine information platform for India.
          </p>
          
          <div className="mb-12 relative max-w-3xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 blur-3xl -z-10" />
            <Search autoFocus />
          </div>

          <div className="flex flex-wrap justify-center gap-3 items-center">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mr-2">{t('suggestedQueries')}:</span>
            {SUGGESTED_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => {
                  if (q.includes('vs')) {
                    const parts = q.split(' vs ');
                    navigate(`/compare/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`);
                  } else {
                    navigate(`/medicine/${encodeURIComponent(q)}`);
                  }
                }}
                className="px-5 py-2.5 bg-white hover:bg-black hover:text-white border border-gray-100 rounded-2xl text-sm font-bold transition-all shadow-sm hover:shadow-xl active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Premium Features Highlight Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => handleFeatureClick('/scan')}
            className="group cursor-pointer relative overflow-hidden bg-white border-2 border-blue-100 rounded-[3rem] p-10 hover:border-blue-500 hover:shadow-2xl transition-all"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-500/20 transition-colors" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">AI Health Scanner</h3>
              <p className="text-lg text-gray-500 font-medium mb-8">
                Instantly identify medicines, analyze doctor prescriptions, and understand lab test reports by taking a photo.
              </p>
              <div className="flex items-center gap-2 text-blue-600 font-bold">
                {user ? 'Open Scanner' : 'Sign in to use'} <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            onClick={() => handleFeatureClick('/timetable')}
            className="group cursor-pointer relative overflow-hidden bg-white border-2 border-purple-100 rounded-[3rem] p-10 hover:border-purple-500 hover:shadow-2xl transition-all"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-purple-500/20 transition-colors" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <CalendarClock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Smart Timetable</h3>
              <p className="text-lg text-gray-500 font-medium mb-8">
                Never miss a dose. Set up personalized medication reminders with push notifications for you and your family.
              </p>
              <div className="flex items-center gap-2 text-purple-600 font-bold">
                {user ? 'Open Timetable' : 'Sign in to use'} <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Compare Section - Immersive Bento Style */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <CompareSearch />
            </motion.div>
          </div>
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-black text-white p-10 rounded-[3rem] h-full flex flex-col justify-between relative overflow-hidden group shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-600/30 transition-colors" />
              <div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
                  <Scale className="w-6 h-6" />
                </div>
                <h2 className="text-4xl font-black mb-4 tracking-tight leading-none">Smart<br />Comparison</h2>
                <p className="text-gray-400 font-medium text-lg">Side-by-side analysis of salts, side effects, and more.</p>
              </div>
              <div className="mt-12">
                <div className="flex -space-x-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-black bg-gray-800 flex items-center justify-center text-[10px] font-black">
                      MED
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Common Conditions - Bento Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="flex items-end justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-black tracking-tight">{t('commonConditions')}</h2>
              <p className="text-gray-400 font-medium">Quick access to common health needs</p>
            </div>
          </div>
        </div>
        <DiseaseGrid />
      </section>

      {/* Popular Medicines - Premium Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-black text-black tracking-tight">{t('popularMedicines')}</h2>
          <div className="h-px flex-grow mx-8 bg-gray-100 hidden md:block" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {POPULAR_MEDS.map((med, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/medicine/${encodeURIComponent(med.name)}`}
                className="block p-10 bg-white border border-gray-100 rounded-[3rem] shadow-sm hover:shadow-2xl hover:border-black transition-all group h-full relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-[4rem] -z-10 group-hover:bg-black/5 transition-colors" />
                <div className="flex justify-between items-start mb-8">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-black transition-colors">
                      {med.category}
                    </span>
                    <span className="inline-flex w-fit items-center gap-1 px-2 py-1 bg-green-50 text-green-600 text-[8px] font-black uppercase tracking-widest rounded-md">
                      <ShieldCheck className="w-3 h-3" /> CDSCO Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (compareList.includes(med.name)) {
                          removeFromCompare(med.name);
                          showToast(`Removed ${med.name} from comparison.`, 'info');
                        } else {
                          addToCompare(med.name);
                          showToast(`Added ${med.name} to comparison.`, 'success');
                        }
                      }}
                      className={`p-3 rounded-2xl transition-all shadow-sm ${compareList.includes(med.name) ? 'bg-black text-white' : 'bg-gray-50 hover:bg-black hover:text-white text-gray-400'}`}
                    >
                      <Scale className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-3xl font-black text-black mb-4 tracking-tight leading-none">{med.name}</h3>
                <p className="text-lg text-gray-500 font-medium leading-relaxed line-clamp-3">{med.summary}</p>
                
                <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">View Details</span>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-all transform group-hover:translate-x-2" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Banned Drugs Search Section - NEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="bg-red-50 border-2 border-red-100 p-10 md:p-16 rounded-[4rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 text-xs font-black uppercase tracking-[0.2em] rounded-full mb-6">
                <Ban className="w-4 h-4" /> CDSCO Alert
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-red-900 tracking-tight mb-4">Banned Drugs Search</h2>
              <p className="text-xl text-red-700/80 font-medium max-w-2xl">
                Quickly check if a medication is prohibited for manufacture and sale in India.
              </p>
            </div>
            <Link 
              to="/banned-drugs" 
              className="px-8 py-4 bg-red-600 text-white rounded-full font-black flex items-center gap-2 shadow-xl hover:bg-red-700 transition-all w-fit"
            >
              Full Registry <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mb-12 relative z-10 max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-red-400" />
            </div>
            <input
              type="text"
              value={bannedSearchQuery}
              onChange={(e) => setBannedSearchQuery(e.target.value)}
              placeholder="Search banned drug name..."
              className="block w-full pl-14 pr-6 py-5 bg-white border border-red-100 rounded-[2rem] text-lg focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all shadow-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {filteredBannedHighlight.map((drug, index) => (
              <motion.div 
                key={index} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-red-100 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">{drug.drug_name}</h3>
                <p className="text-sm font-bold text-red-600 mb-4 line-clamp-2">{drug.side_effects_serious[0]}</p>
                <button
                  onClick={() => navigate(`/medicine/${encodeURIComponent(drug.drug_name)}`)}
                  className="text-sm font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1 mt-auto"
                >
                  Read Why <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
            {filteredBannedHighlight.length === 0 && (
              <div className="col-span-full py-10 text-center text-red-400 font-bold">
                No matching banned drugs found in our quick lookup.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Smart Suggestions - Immersive Gradient */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="bg-gradient-to-br from-gray-900 to-black text-white p-10 md:p-16 rounded-[4rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-600/10 rounded-full -mr-64 -mt-64 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full -ml-32 -mb-32 blur-[100px]" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tight">{t('peopleAlsoSearch')}</h2>
                <p className="text-gray-400 font-medium mt-2">Based on current health trends and CDSCO guidelines</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PEOPLE_ALSO_SEARCH.map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/medicine/${encodeURIComponent(item.query)}`)}
                  className="group flex flex-col p-6 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-[2rem] transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-bold text-white">{item.query}</span>
                    <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                  </div>
                  <span className="text-sm text-gray-400 font-medium">{item.reason}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer Footer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-100 p-16 rounded-[4rem] text-center shadow-sm">
          <div className="w-20 h-20 bg-yellow-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <AlertTriangle className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-3xl font-black mb-6 tracking-tight">Medical Disclaimer</h2>
          <p className="text-xl text-gray-400 font-medium italic max-w-3xl mx-auto leading-relaxed">
            "{t('disclaimer')}"
          </p>
        </div>
      </section>
    </div>
  );
};

