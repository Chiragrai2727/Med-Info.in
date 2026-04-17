import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Ban, AlertTriangle, Search, ChevronLeft, ShieldAlert, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import bannedDrugsData from '../data/banned_medicines.json';
import { useLanguage } from '../LanguageContext';

export const BannedDrugs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDrugs, setFilteredDrugs] = useState(bannedDrugsData);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = bannedDrugsData.filter(drug => 
      drug.drug_name.toLowerCase().includes(query) ||
      drug.side_effects_serious.some(se => se.toLowerCase().includes(query))
    );
    setFilteredDrugs(filtered);
  }, [searchQuery]);

  return (
    <div className="min-h-screen pt-40 pb-20 bg-[#FAFAFA] pt-[calc(10rem+env(safe-area-inset-top))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 font-medium">
          <ChevronLeft className="w-4 h-4" />
          {t('backToHome')}
        </Link>
        <div className="bg-red-600 text-white p-10 md:p-16 rounded-[4rem] relative overflow-hidden mb-16 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white text-xs font-black uppercase tracking-[0.2em] rounded-full mb-6 backdrop-blur-md">
              <ShieldAlert className="w-4 h-4" /> {t('officialCDSCOData')}
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">{t('bannedDrugsRegistry')}</h1>
            <p className="text-xl md:text-2xl text-red-100 font-medium max-w-3xl leading-relaxed">
              {t('bannedDrugsDesc')}
            </p>
          </div>
        </div>

        <div className="mb-12 relative">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchBannedPlaceholderLong')}
            className="block w-full pl-16 pr-6 py-6 bg-white border border-gray-200 rounded-[2.5rem] text-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all shadow-sm font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrugs.map((drug, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/medicine/${encodeURIComponent(drug.drug_name)}`)}
              className="bg-white p-8 rounded-[2.5rem] border border-red-100 shadow-sm hover:shadow-xl hover:border-red-300 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <Ban className="w-6 h-6 text-red-600" />
                </div>
                <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  {t('banned')}
                </span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{drug.drug_name}</h3>
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{t('primaryRisk')}</p>
                <p className="text-red-600 font-bold">{drug.side_effects_serious[0]}</p>
              </div>
              <div className="pt-6 border-t border-gray-50 flex items-center text-sm font-black uppercase tracking-widest text-gray-400 group-hover:text-red-600 transition-colors">
                {t('viewDetails')} <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </motion.div>
          ))}
        </div>

        {filteredDrugs.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">{t('noBannedFoundTitle')}</h3>
            <p className="text-gray-500 font-medium">{t('noBannedFoundDesc')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
