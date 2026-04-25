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
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-sm 2xl:text-xl 2xl:px-6 2xl:py-3 font-medium"
      >
        <Globe className="w-4 h-4 2xl:w-8 h-8" />
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
              className="absolute right-0 mt-2 w-40 2xl:w-64 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 2xl:px-6 2xl:py-4 text-sm 2xl:text-xl hover:bg-black/5 transition-colors ${
                    language === lang.code ? 'font-bold text-black' : 'text-gray-600'
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
