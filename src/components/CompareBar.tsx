import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCompare } from '../CompareContext';
import { X, Scale, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../LanguageContext';

export const CompareBar: React.FC = () => {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  if (compareList.length === 0 || location.pathname.startsWith('/compare')) return null;

  const handleCompare = () => {
    if (compareList.length === 2) {
      navigate(`/compare/${encodeURIComponent(compareList[0])}/${encodeURIComponent(compareList[1])}`);
      clearCompare();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}
        className="fixed left-0 right-0 z-[90] px-4 py-3 bg-black/95 backdrop-blur-xl border-b border-white/10 pointer-events-none shadow-2xl"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-6 pointer-events-auto">
          <div className="hidden md:flex items-center gap-2 text-white/40">
            <Scale className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Compare Mode</span>
          </div>

          <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {compareList.map((name, index) => (
              <motion.div 
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={name}
                className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full whitespace-nowrap group shadow-xl"
              >
                <span className="text-xs font-black">{name}</span>
                <button 
                  onClick={() => removeFromCompare(name)}
                  className="p-1 hover:bg-black/10 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
            {compareList.length < 2 && (
              <div className="flex items-center gap-2 bg-white/5 text-white/30 px-4 py-2 rounded-full border border-dashed border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest">Select {2 - compareList.length} more...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {compareList.length > 0 && (
              <button 
                onClick={clearCompare}
                className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors px-2"
              >
                Clear
              </button>
            )}
            <button
              disabled={compareList.length < 2}
              onClick={handleCompare}
              className={`flex items-center gap-2 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-2xl ${
                compareList.length === 2 
                  ? 'bg-white text-black hover:bg-gray-200 active:scale-95' 
                  : 'bg-white/10 text-white/20 cursor-not-allowed'
              }`}
            >
              <span>Compare Now</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
