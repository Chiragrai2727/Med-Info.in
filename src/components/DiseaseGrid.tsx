import React from 'react';
import { useLanguage } from '../LanguageContext';
import { DISEASES } from '../types';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export const DiseaseGrid: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      {DISEASES.map((disease, index) => {
        const IconComponent = (Icons as unknown as Record<string, React.ElementType>)[disease.icon] || Icons.Activity;
        return (
          <motion.button
            key={disease.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/condition/${disease.id}`)}
            className="flex flex-col items-center justify-center p-10 bg-white border border-gray-50 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-black transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gray-50 rounded-bl-[2rem] -z-10 group-hover:bg-black/5 transition-colors" />
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-black group-hover:text-white transition-all shadow-inner">
              <IconComponent className="w-8 h-8" />
            </div>
            <span className="font-black text-black text-base md:text-lg tracking-tight leading-none">
              {t(disease.id)}
            </span>
            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
