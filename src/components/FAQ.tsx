import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export const FAQ: React.FC = () => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  const FAQS = [
    {
      id: 'q1',
      question: t('faq_q1'),
      answer: t('faq_a1')
    },
    {
      id: 'q2',
      question: t('faq_q2'),
      answer: t('faq_a2')
    },
    {
      id: 'q3',
      question: t('faq_q3'),
      answer: t('faq_a3')
    },
    {
      id: 'q4',
      question: t('faq_q4'),
      answer: t('faq_a4')
    },
    {
      id: 'q5',
      question: t('faq_q5'),
      answer: t('faq_a5')
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-24 px-4 sm:px-6">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          <HelpCircle className="w-4 h-4" />
          {t('gotQuestions')}
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">{t('faqTitle')}</h2>
        <p className="text-xl text-slate-500 font-medium">{t('faqSubtitle')}</p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq) => (
          <div 
            key={faq.id} 
            className={`border rounded-[2rem] transition-all overflow-hidden ${
              expanded === faq.id 
                ? 'bg-blue-50/30 border-blue-100 shadow-lg' 
                : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <button
              onClick={() => toggle(faq.id)}
              className="w-full px-8 py-6 text-left flex items-center justify-between group"
            >
              <span className={`text-xl font-bold tracking-tight transition-colors ${
                expanded === faq.id ? 'text-blue-600' : 'text-slate-900'
              }`}>
                {faq.question}
              </span>
              <div className={`shrink-0 ml-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                expanded === faq.id ? 'bg-blue-600 text-white rotate-180' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
              }`}>
                <ChevronDown className="w-5 h-5" />
              </div>
            </button>
            <AnimatePresence>
              {expanded === faq.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="px-8 pb-8 text-lg text-slate-600 font-medium leading-relaxed">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};
