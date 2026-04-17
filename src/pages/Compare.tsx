import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { compareMedicines } from '../services/geminiService';
import { Medicine } from '../types';
import { motion } from 'motion/react';
import { ChevronLeft, Loader2, Scale, AlertTriangle, ShieldCheck } from 'lucide-react';

export const Compare: React.FC = () => {
  const { med1, med2 } = useParams<{ med1: string; med2: string }>();
  const { t, language } = useLanguage();
  const [data, setData] = useState<{
    med1: Medicine;
    med2: Medicine;
    comparison: {
      feature: string;
      val1: string;
      val2: string;
      difference: string;
    }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (med1 && med2) {
        setLoading(true);
        const result = await compareMedicines(med1, med2, language);
        setData(result);
        setLoading(false);
      }
    };
    loadData();
    window.scrollTo(0, 0);
  }, [med1, med2, language]);

  if (loading) {
    return (
      <div className="min-h-screen pt-40 pb-20 pt-[calc(10rem+env(safe-area-inset-top))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-32 h-6 bg-gray-200 rounded-full mb-8 animate-pulse" />
          
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-gray-200 rounded-3xl animate-pulse" />
            <div>
              <div className="w-64 md:w-96 h-12 bg-gray-200 rounded-xl mb-3 animate-pulse" />
              <div className="w-48 md:w-64 h-6 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Medicine Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[1, 2].map((idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
                <div className="w-24 h-6 bg-gray-200 rounded-full mb-6 animate-pulse" />
                <div className="w-48 h-10 bg-gray-200 rounded-xl mb-4 animate-pulse" />
                <div className="w-32 h-6 bg-gray-200 rounded-lg mb-6 animate-pulse" />
                <div className="w-40 h-4 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="bg-white border border-gray-100 rounded-[3rem] shadow-2xl overflow-hidden mb-16">
            <div className="w-full h-20 bg-gray-900 animate-pulse" />
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="flex border-b border-gray-50">
                <div className="w-1/4 p-8"><div className="w-20 h-4 bg-gray-200 rounded animate-pulse" /></div>
                <div className="w-1/4 p-8"><div className="w-full h-16 bg-gray-200 rounded-xl animate-pulse" /></div>
                <div className="w-1/4 p-8"><div className="w-full h-16 bg-gray-200 rounded-xl animate-pulse" /></div>
                <div className="w-1/4 p-8"><div className="w-full h-16 bg-yellow-100 rounded-2xl animate-pulse" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-yellow-500" />
        </div>
        <h2 className="text-4xl font-black text-black mb-4 tracking-tight">
          {!navigator.onLine ? t('comparisonUnavailable') : t('comparisonNotFound')}
        </h2>
        <p className="text-gray-500 mb-12 max-w-md font-medium">
          {!navigator.onLine 
            ? t('comparisonOfflineDesc')
            : t('comparisonNotFoundDesc')}
        </p>
        <Link to="/" className="px-8 py-4 bg-black text-white rounded-full font-black flex items-center gap-2 shadow-xl hover:bg-gray-800 transition-all">
          <ChevronLeft className="w-4 h-4" /> {t('backToHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-40 pb-20 pt-[calc(10rem+env(safe-area-inset-top))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 font-medium">
          <ChevronLeft className="w-4 h-4" />
          {t('backToHome')}
        </Link>

        <div className="flex items-center gap-4 mb-12">
          <div className="w-14 h-14 bg-black rounded-3xl flex items-center justify-center text-white shadow-2xl">
            <Scale className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-5xl font-black text-black tracking-tighter leading-none">
              {data.med1.drug_name} <span className="text-gray-300 mx-2 font-light">{t('vs')}</span> {data.med2.drug_name}
            </h1>
            <p className="text-lg text-gray-400 font-medium mt-2">{t('featureComparison')}</p>
          </div>
        </div>

        {/* Medicine Cards - Text Only */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {[data.med1, data.med2].map((med, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-gray-50 rounded-bl-[6rem] -z-10 group-hover:bg-black/5 transition-colors" />
              <div className="mb-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  {med.prescription_required ? t('prescriptionRequired') : t('otc')}
                </span>
                {med.india_regulatory_status?.toLowerCase().includes('approved') && (
                  <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {t('cdscoVerified')}
                  </span>
                )}
              </div>
              <h2 className="text-4xl font-black text-black mb-1 tracking-tight">{med.drug_name}</h2>
              <p className="text-xl text-gray-400 font-medium mb-6">{med.drug_class}</p>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                {med.category}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white border border-gray-100 rounded-[3rem] shadow-2xl overflow-hidden mb-16">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black text-white">
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] w-1/4 opacity-60">{t('feature')}</th>
                  <th className="px-10 py-8 text-xl font-black w-1/4">{data.med1.drug_name}</th>
                  <th className="px-10 py-8 text-xl font-black w-1/4">{data.med2.drug_name}</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] w-1/4 opacity-60">{t('difference')}</th>
                </tr>
              </thead>
              <tbody>
                {data.comparison.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-10 py-8 font-black text-black text-xs uppercase tracking-widest border-r border-gray-50">{row.feature}</td>
                    <td className="px-10 py-8 text-gray-700 text-lg font-medium leading-relaxed">{row.val1}</td>
                    <td className="px-10 py-8 text-gray-700 text-lg font-medium leading-relaxed">{row.val2}</td>
                    <td className="px-10 py-8">
                      <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-xs font-bold text-yellow-800 leading-relaxed">
                        {row.difference}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-gray-50 border border-gray-100 p-12 rounded-[3rem] text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black mb-4 tracking-tight">{t('medicalDisclaimer')}</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
            {t('disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
};
