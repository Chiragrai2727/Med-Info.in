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
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-sm font-medium"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{LANGUAGES.find(l => l.code === language)?.name}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-48 bg-surface border border-border rounded-2xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.2)] z-50 overflow-hidden p-2"
            >
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
