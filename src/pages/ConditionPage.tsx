import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { getMedicinesForCondition } from '../services/aiService';
import { DISEASES } from '../types';
import { motion } from 'motion/react';
import { ChevronLeft, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export const ConditionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const [medicines, setMedicines] = useState<{ name: string; category: string; summary: string; india_regulatory_status?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const condition = DISEASES.find(d => d.id === id);

  useEffect(() => {
    const loadData = async () => {
      if (condition) {
        setLoading(true);
        setErrorMsg(null);
        try {
          const data = await getMedicinesForCondition(condition.name, language);
          setMedicines(data);
        } catch (e: any) {
          console.error(e);
          setErrorMsg(e.message);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
    window.scrollTo(0, 0);
  }, [id, language]);

  if (!condition) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-4xl font-black text-black mb-4 tracking-tight">Condition not found</h2>
        <p className="text-gray-500 mb-12 max-w-md font-medium">
          We couldn't find information for this condition. Try searching for a common symptom or disease.
        </p>
        <Link to="/" className="px-8 py-4 bg-black text-white rounded-full font-black flex items-center gap-2 shadow-xl hover:bg-gray-800 transition-all">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-40 pb-20 pt-[calc(10rem+env(safe-area-inset-top))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 font-medium">
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-16">
          <h1 className="text-5xl font-black text-black mb-4">{t(condition.id)}</h1>
          <div className="flex flex-wrap gap-2">
            {condition.symptoms.map((symptom, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                {symptom}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-black" />
            <p className="text-gray-500 font-medium">{t('loading')}</p>
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-black mb-2">Search Failed</h3>
              <p className="text-gray-500 font-medium max-w-md mx-auto">{errorMsg}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-black text-white rounded-full font-bold shadow-lg hover:bg-gray-800 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {medicines.map((med, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/medicine/${encodeURIComponent(med.name)}`}
                  className="block p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-2xl hover:border-black transition-all group h-full"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">
                        {med.category}
                      </span>
                      {med.india_regulatory_status?.toLowerCase().includes('approved') && (
                        <span className="inline-flex w-fit items-center gap-1 px-2 py-1 bg-green-50 text-green-600 text-[8px] font-black uppercase tracking-widest rounded-md">
                          <ShieldCheck className="w-3 h-3" /> CDSCO Verified
                        </span>
                      )}
                    </div>
                    <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-3">{med.name}</h3>
                  <p className="text-gray-500 leading-relaxed">{med.summary}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
