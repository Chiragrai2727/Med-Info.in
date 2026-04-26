import React from 'react';
import { useLanguage } from '../LanguageContext';
import { DISEASES } from '../types';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

import { Helmet } from 'react-helmet-async';

export const Conditions: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent pt-40 sm:pt-48 pb-32">
      <Helmet>
        <title>Medicines for Common Health Conditions - Aethelcare</title>
        <meta name="description" content="Browse medicines by health conditions like fever, cough, diabetes, and more. Understand common treatments and pharmaceutical guidance for various ailments." />
        <meta name="keywords" content="medicines for fever, medicines for diabetes, cough syrup list India, medical conditions and treatments" />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8 mb-20">
          <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl relative overflow-hidden group">
            <Icons.Stethoscope className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute top-0 right-0 w-8 h-8 bg-white/20 rounded-full blur-xl animate-pulse" />
          </div>
          <div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-[-0.05em] uppercase leading-none mb-4">{t('commonConditions')}</h1>
            <p className="text-xl md:text-2xl text-slate-400 font-bold tracking-tight opacity-70 leading-none">{t('browseByCondition')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {DISEASES.map((disease, index) => {
            const IconComponent = (Icons as unknown as Record<string, React.ElementType>)[disease.icon] || Icons.Activity;
            return (
              <motion.button
                key={disease.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.8 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/condition/${disease.id}`)}
                className="flex flex-col items-center justify-center p-10 backdrop-blur-xl bg-white/70 border-2 border-white rounded-[4rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-2xl hover:border-slate-900 transition-all group relative overflow-hidden h-full min-h-[300px]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                
                <div className="w-20 h-20 backdrop-blur-md bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white group-hover:bg-slate-900 transition-all shadow-inner relative z-10">
                  <IconComponent className="w-10 h-10 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <span className="font-black text-slate-900 text-2xl tracking-tighter text-center leading-none uppercase relative z-10">
                  {t(disease.id)}
                </span>
                
                <div className="mt-8 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 relative z-10 p-3 backdrop-blur-md bg-slate-900/5 rounded-full">
                  <Icons.ArrowRight className="w-6 h-6 text-slate-900" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
