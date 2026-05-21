import React from 'react';
import { useLanguage } from '../LanguageContext';
import { LANGUAGES } from '../types';
import { Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-surface dark:bg-slate-900 border border-border/80 hover:bg-bg/80 text-text-primary shadow-sm hover:shadow transition-all text-xs sm:text-sm font-black"
      >
        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
        <span>{LANGUAGES.find(l => l.code === language)?.name}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[105]" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-48 bg-surface dark:bg-slate-900 border border-border rounded-2xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.2)] z-[110] overflow-hidden"
            >
              <div className="max-h-[60vh] overflow-y-auto p-2 hide-scrollbar">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-all font-bold ${
                      language === lang.code 
                        ? 'bg-primary/5 text-primary' 
                        : 'text-text-secondary hover:bg-bg hover:text-text-primary'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
