import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { getMedicinesForCondition } from '../services/geminiService';
import { DISEASES } from '../types';
import { motion } from 'motion/react';
import { ChevronLeft, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

import { Helmet } from 'react-helmet-async';

export const ConditionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const [medicines, setMedicines] = useState<{ name: string; category: string; summary: string; india_regulatory_status?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const condition = DISEASES.find(d => d.id === id);

  useEffect(() => {
    const loadData = async () => {
      if (condition) {
        setLoading(true);
        const data = await getMedicinesForCondition(condition.name, language);
        setMedicines(data);
        setLoading(false);
      }
    };
    loadData();
    window.scrollTo(0, 0);
  }, [id, language]);

  if (!condition) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-bg rounded-[2rem] flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-text-secondary" />
        </div>
        <h2 className="text-4xl font-black text-text-primary mb-4 tracking-tight">{t('conditionNotFound')}</h2>
        <p className="text-text-secondary mb-12 max-w-md font-medium">
          {t('conditionNotFoundDesc')}
        </p>
        <Link to="/" className="px-8 py-4 bg-dark-bg text-white rounded-full font-black flex items-center gap-2 shadow-xl hover:bg-dark-bg/80 transition-all">
          <ChevronLeft className="w-4 h-4" /> {t('backToHome')}
        </Link>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-transparent pt-40 sm:pt-48 pb-32">
      <Helmet>
        <title>Medicines for {t(condition.id)} - Dosage & Safety Guide | Aethelcare</title>
        <meta name="description" content={`Find the best medicines for ${t(condition.id)} in India. Learn about treatments, symptoms: ${condition.symptoms.join(', ')}, and safety precautions.`} />
        <meta name="keywords" content={`medicines for ${t(condition.id)}, ${t(condition.id)} symptoms, how to treat ${t(condition.id)}, medication for ${t(condition.id)} India`} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-3 text-text-secondary hover:text-text-primary transition-all mb-12 font-black uppercase tracking-[0.2em] text-[10px] group">
          <div className="p-2 backdrop-blur-md bg-surface rounded-xl border border-surface shadow-sm group-hover:-translate-x-2 transition-transform">
            <ChevronLeft className="w-4 h-4" />
          </div>
          {t('backToHome')}
        </Link>
 
        <div className="mb-20">
          <h1 className="text-5xl md:text-8xl font-black text-text-primary mb-8 tracking-[-0.05em] uppercase leading-none">{t(condition.id)}</h1>
          <div className="flex flex-wrap gap-3">
            {condition.symptoms.map((symptom, i) => (
              <span key={i} className="px-6 py-2 backdrop-blur-md bg-surface/60 border border-surface rounded-full text-xs font-black uppercase tracking-widest text-text-secondary shadow-sm">
                {symptom}
              </span>
            ))}
          </div>
        </div>
 
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-16 h-16 border-4 border-dark-bg border-t-transparent rounded-full animate-spin shadow-xl" />
            <p className="text-text-secondary font-black uppercase tracking-[0.3em] text-[10px] opacity-60">{t('loading')} AI Intelligence</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {medicines.map((med, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
              >
                <Link
                  to={`/medicine/${encodeURIComponent(med.name)}`}
                  className="block p-10 backdrop-blur-xl bg-surface/70 border-2 border-surface rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-2xl hover:border-dark-bg transition-all group h-full relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-10">
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary group-hover:text-text-primary transition-colors opacity-60">
                        {med.category}
                      </span>
                      {med.india_regulatory_status?.toLowerCase().includes('approved') && (
                        <span className="inline-flex w-fit items-center gap-2 px-3 py-1.5 backdrop-blur-md bg-success/10 text-success text-[8px] font-black uppercase tracking-[0.2em] rounded-lg border border-success/20">
                          <ShieldCheck className="w-3 h-3" /> {t('cdscoVerified')}
                        </span>
                      )}
                    </div>
                    <div className="w-12 h-12 backdrop-blur-md bg-bg rounded-2xl flex items-center justify-center group-hover:bg-dark-bg group-hover:text-white transition-all shadow-inner">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-text-primary mb-4 tracking-tight uppercase leading-none">{med.name}</h3>
                  <p className="text-text-secondary font-bold tracking-tight text-lg opacity-70 leading-relaxed italic line-clamp-3">"{med.summary}"</p>
                  
                  <div className="absolute top-0 right-0 w-32 h-32 bg-dark-bg/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
