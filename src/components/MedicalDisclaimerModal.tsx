import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Check, ShieldAlert } from 'lucide-react';

export const MedicalDisclaimerModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('aethelcare_disclaimer_acknowledged');
    }
    return false;
  });

  const handleAcknowledge = () => {
    localStorage.setItem('aethelcare_disclaimer_acknowledged', 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2.5rem] p-8 md:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Important Medical Disclaimer
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">
                  Please Read Carefully
                </p>
              </div>
            </div>

            <div className="space-y-6 text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 text-amber-900 dark:text-amber-200">
                <p className="font-bold">
                  This site is strictly for study and educational purposes only.
                </p>
                <p className="mt-2 text-sm opacity-90">
                  This application does not prescribe, recommend, or instruct you to take any medications. The information provided here should never replace professional medical advice. Always consult a qualified doctor before making any health-related decisions.
                </p>
              </div>

              <div className="flex gap-4 items-start">
                <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 text-blue-600 dark:text-blue-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1">AI Scanner Limitations</h3>
                  <p className="text-sm">
                    While our AI-powered scanner utilizes advanced models that are highly accurate in extracting and analyzing information, AI can occasionally generate incorrect or misleading results. You must always manually verify the information extracted and consult with a healthcare professional regarding any medical concerns.
                  </p>
                </div>
              </div>

            </div>

            <div className="mt-10">
              <button
                onClick={handleAcknowledge}
                className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <Check className="w-5 h-5" />
                I Understand & Agree
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
