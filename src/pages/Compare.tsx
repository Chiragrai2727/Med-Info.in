import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { compareMedicines } from '../services/geminiService';
import { Medicine } from '../types';
import { motion } from 'motion/react';
import { ChevronLeft, Scale, AlertTriangle, ShieldCheck } from 'lucide-react';

import { Helmet } from 'react-helmet-async';

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

  return (
    <>
      <Helmet>
        <title>{med1 && med2 ? `${med1} vs ${med2}` : 'Compare Medicines'} | Aethelcare Comparison</title>
        <meta name="description" content={`Compare ${med1} and ${med2} side-by-side. See differences in dosage, side effects, price, and regulatory status in India.`} />
        <meta name="keywords" content={`compare ${med1}, compare ${med2}, medicine comparison India, drug side effects comparison`} />
        <link rel="canonical" href={`https://aethelcare.xyz/compare/${med1}/${med2}`} />
      </Helmet>

      {loading ? (
        <div className="min-h-screen bg-transparent pt-40 sm:pt-48 pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-48 h-10 backdrop-blur-md bg-surface/20 rounded-full mb-12 animate-pulse" />
            
            <div className="flex items-center gap-6 mb-20">
              <div className="w-20 h-20 backdrop-blur-md bg-surface/20 rounded-[2rem] animate-pulse" />
              <div>
                <div className="w-64 md:w-96 h-16 backdrop-blur-md bg-surface/20 rounded-[2rem] mb-4 animate-pulse" />
                <div className="w-48 md:w-64 h-8 backdrop-blur-md bg-surface/10 rounded-xl animate-pulse" />
              </div>
            </div>
 
            {/* Medicine Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
              {[1, 2].map((idx) => (
                <div key={idx} className="backdrop-blur-xl bg-surface/40 border-2 border-surface rounded-[4rem] p-12 shadow-sm animate-pulse">
                  <div className="w-32 h-8 bg-surface/50 rounded-full mb-8" />
                  <div className="w-56 h-12 bg-surface/50 rounded-2xl mb-6" />
                  <div className="w-40 h-8 bg-surface/30 rounded-xl mb-8" />
                  <div className="w-48 h-5 bg-surface/20 rounded-lg" />
                </div>
              ))}
            </div>
 
            {/* Table Skeleton */}
            <div className="backdrop-blur-3xl bg-surface/70 border-2 border-surface rounded-[5rem] shadow-2xl overflow-hidden mb-16 animate-pulse">
              <div className="w-full h-24 bg-dark-bg/10" />
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="flex border-b border-surface/50 p-12">
                  <div className="w-1/4 h-8 bg-surface rounded-xl" />
                  <div className="w-1/4 h-20 bg-surface ml-8 rounded-2xl" />
                  <div className="w-1/4 h-20 bg-surface ml-8 rounded-2xl" />
                  <div className="w-1/4 h-20 bg-danger/5 ml-8 rounded-3xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !data ? (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-3xl bg-surface/70 p-20 rounded-[5rem] border border-surface shadow-2xl flex flex-col items-center max-w-2xl"
          >
            <div className="w-24 h-24 backdrop-blur-md bg-danger/5 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
              <AlertTriangle className="w-12 h-12 text-danger" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-text-primary mb-6 tracking-[-0.05em] uppercase leading-none">
              {!navigator.onLine ? t('comparisonUnavailable') : t('comparisonNotFound')}
            </h2>
            <p className="text-text-secondary font-bold tracking-tight text-xl mb-12 opacity-70">
              {!navigator.onLine 
                ? t('comparisonOfflineDesc')
                : t('comparisonNotFoundDesc')}
            </p>
            <Link to="/" className="px-12 py-6 bg-dark-bg text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:bg-dark-bg/90 transition-all active:scale-95">
              <ChevronLeft className="w-5 h-5" /> {t('backToHome')}
            </Link>
          </motion.div>
        </div>
      ) : (
        <div className="min-h-screen bg-transparent pt-40 sm:pt-48 pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link to="/" className="inline-flex items-center gap-3 text-text-secondary hover:text-text-primary transition-all mb-12 font-black uppercase tracking-[0.2em] text-[10px] group">
              <div className="p-2 backdrop-blur-md bg-surface rounded-xl border border-surface shadow-sm group-hover:-translate-x-2 transition-transform">
                <ChevronLeft className="w-4 h-4" />
              </div>
              {t('backToHome')}
            </Link>
 
            <div className="flex items-center gap-8 mb-20">
              <div className="w-20 h-20 bg-dark-bg rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl rotate-12">
                <Scale className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-5xl md:text-8xl font-black text-text-primary tracking-[-0.05em] uppercase leading-none">
                  {data.med1.drug_name} <span className="text-text-secondary/20 mx-4 font-light">{t('vs')}</span> {data.med2.drug_name}
                </h1>
                <p className="text-xl md:text-2xl text-text-secondary font-black uppercase tracking-[0.2em] mt-4 opacity-60 leading-none">{t('featureComparison')}</p>
              </div>
            </div>
 
            {/* Medicine Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
              {[data.med1, data.med2].map((med, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1, duration: 0.8 }}
                  className="backdrop-blur-xl bg-surface/70 border-2 border-surface rounded-[4rem] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:shadow-2xl transition-all duration-700"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-dark-bg/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-1000" />
                  
                  <div className="mb-10 flex flex-wrap gap-3 relative z-10">
                    <span className="px-5 py-2 backdrop-blur-md bg-dark-bg text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                      {med.prescription_required ? t('prescriptionRequired') : t('otc')}
                    </span>
                    {med.india_regulatory_status?.toLowerCase().includes('approved') && (
                      <span className="px-5 py-2 backdrop-blur-md bg-success/10 text-success border border-success/20 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> {t('cdscoVerified')}
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-5xl font-black text-text-primary mb-2 tracking-[-0.05em] uppercase leading-none relative z-10">{med.drug_name}</h2>
                  <p className="text-xl text-text-secondary font-bold tracking-tight mb-8 opacity-70 relative z-10">{med.drug_class}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-text-secondary relative z-10">
                    <div className="w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50" />
                    {med.category}
                  </div>
                </motion.div>
              ))}
            </div>
 
            {/* Comparison Table */}
            <div className="backdrop-blur-3xl bg-surface/70 border-2 border-surface rounded-[5rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] overflow-hidden mb-24">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-dark-bg text-white">
                      <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.3em] w-1/4 opacity-40">{t('feature')}</th>
                      <th className="px-12 py-10 text-2xl font-black tracking-tight uppercase w-1/4">{data.med1.drug_name}</th>
                      <th className="px-12 py-10 text-2xl font-black tracking-tight uppercase w-1/4">{data.med2.drug_name}</th>
                      <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.3em] w-1/4 opacity-40">{t('difference')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.comparison.map((row, i) => (
                      <tr key={i} className={`border-b border-surface transition-all hover:bg-surface/50 group`}>
                        <td className="px-12 py-10 font-black text-text-primary text-xs uppercase tracking-widest border-r border-surface/50 opacity-60 group-hover:opacity-100">{row.feature}</td>
                        <td className="px-12 py-10 text-text-secondary text-lg font-bold tracking-tight leading-relaxed">{row.val1}</td>
                        <td className="px-12 py-10 text-text-secondary text-lg font-bold tracking-tight leading-relaxed">{row.val2}</td>
                        <td className="px-12 py-10">
                          <div className="p-8 backdrop-blur-md bg-danger/5 border border-danger/20 rounded-[2rem] text-sm font-bold text-text-primary/80 leading-relaxed shadow-inner">
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
            <div className="backdrop-blur-2xl bg-dark-bg p-16 rounded-[4rem] text-center relative overflow-hidden border-2 border-dark-bg/10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-[100px]" />
              <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-8 animate-pulse" />
              <h2 className="text-4xl font-black mb-6 tracking-tight uppercase text-white leading-none">{t('medicalDisclaimer')}</h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed font-bold tracking-tight italic opacity-70">
                "{t('disclaimer')}"
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
