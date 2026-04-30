import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCompare } from '../CompareContext';
import { useAuth } from '../AuthContext';
import { X, Scale, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../LanguageContext';
import { PricingModal } from './PricingModal';

export const CompareBar: React.FC = () => {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  
  const [showPricingModal, setShowPricingModal] = useState(false);

  if (compareList.length === 0 || location.pathname.startsWith('/compare')) return null;

  const handleCompare = () => {
    if (compareList.length === 2) {
      if (profile?.is_premium || profile?.role === 'admin') {
        navigate(`/compare/${encodeURIComponent(compareList[0])}/${encodeURIComponent(compareList[1])}`);
        clearCompare();
      } else {
        setShowPricingModal(true);
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 sm:bottom-12 left-0 right-0 z-[95] px-4 pointer-events-none"
        >
          <div className="max-w-2xl mx-auto flex items-center gap-4 pointer-events-auto bg-black/90 backdrop-blur-2xl px-4 py-3 sm:px-6 sm:py-4 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10">
            <div className="hidden sm:flex items-center gap-2 text-white/40 shrink-0">
              <Scale className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Compare</span>
            </div>

            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {compareList.map((name, index) => (
                <motion.div 
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key={name}
                  className="flex items-center gap-2 bg-white text-black px-3 py-1.5 rounded-full whitespace-nowrap shadow-md border border-white/20 grow min-w-0"
                >
                  <span className="text-[10px] font-black tracking-tight truncate flex-1">{name}</span>
                  <button 
                    onClick={() => removeFromCompare(name)}
                    className="p-1 hover:bg-black/10 rounded-full transition-colors shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
              {compareList.length < 2 && (
                <div className="flex items-center gap-2 bg-white/5 text-white/20 px-4 py-1.5 rounded-full border border-dashed border-white/10 grow min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-widest truncate">Select {2 - compareList.length} more...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {compareList.length > 0 && (
                <button 
                  onClick={clearCompare}
                  className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors px-1"
                >
                  {t('clear') || 'Clear'}
                </button>
              )}
              <button
                disabled={compareList.length < 2}
                onClick={handleCompare}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
                  compareList.length === 2 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30 active:scale-95' 
                    : 'bg-white/10 text-white/20 cursor-not-allowed'
                }`}
              >
                <span>Compare</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
      />
    </>
  );
};

