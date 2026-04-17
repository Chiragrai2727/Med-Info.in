import React from 'react';
import { useLanguage } from '../LanguageContext';
import { DISEASES } from '../types';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export const Conditions: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-40 pb-20 bg-[#FAFAFA] pt-[calc(10rem+env(safe-area-inset-top))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl">
            <Icons.Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-black tracking-tight">{t('commonConditions')}</h1>
            <p className="text-gray-400 font-medium">Browse medication information by condition</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {DISEASES.map((disease, index) => {
            const IconComponent = (Icons as unknown as Record<string, React.ElementType>)[disease.icon] || Icons.Activity;
            return (
              <motion.button
                key={disease.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/condition/${disease.id}`)}
                className="flex flex-col items-center justify-center p-8 glass rounded-[2.5rem] shadow-sm hover:shadow-[0_20px_40px_rgba(37,99,235,0.1)] transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-[2rem] -z-10 group-hover:bg-blue-600/10 transition-colors" />
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 group-hover:bg-slate-900 transition-all shadow-inner">
                  <IconComponent className="w-8 h-8 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <span className="font-black text-black text-lg tracking-tight text-center leading-tight">
                  {t(disease.id)}
                </span>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icons.ArrowRight className="w-4 h-4 text-blue-600" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
