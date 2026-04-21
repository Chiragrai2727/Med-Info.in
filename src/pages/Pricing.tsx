import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { PLANS } from '../config/plans';
import { Check, X, ShieldCheck, Zap, Star, Phone, ArrowRight, Calculator, IndianRupee, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Pricing: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile, openAuthModal, updateSubscription } = useAuth();
  const navigate = useNavigate();
  const [savingsValue, setSavingsValue] = useState(1);

  const handleClaimTrial = () => {
    if (!user) {
      openAuthModal();
    } else {
      // In a real app, this would trigger a phone verification flow for trial
      alert('Redirecting to phone verification for your 14-day free trial...');
    }
  };

  const accuracyData = [
    { feature: 'Printed prescriptions', basic: '75-80%', family: '99%' },
    { feature: 'Handwritten prescriptions', basic: 'Not available', family: '99%' },
    { feature: 'Lab reports', basic: 'Not available', family: '99%' },
    { feature: 'Blurry/dark photos', basic: 'Not available', family: '99%' },
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50">
      <Helmet>
        <title>Pricing - {t('appName')}</title>
        <meta name="description" content="Choose the best plan for your family's health and safety." />
      </Helmet>

      {/* Hero / Free Trial Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl"
        >
          {/* Background Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full -ml-32 -mb-32 blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 text-xs font-black uppercase tracking-[0.2em] rounded-full mb-8">
              <Zap className="w-4 h-4" /> Limited Time Offer
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              Try Family Plan free for 14 days
            </h1>
            <p className="text-xl text-slate-400 font-medium mb-10">
              Verify with your phone number, no credit card needed. Get instant access to the 99% accurate AI scanner.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
              <button 
                onClick={handleClaimTrial}
                className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/50 flex items-center gap-3 active:scale-95"
              >
                Claim Free Trial <ArrowRight className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2 text-slate-400 font-bold">
                <Phone className="w-5 h-5" /> Phone Verified Only
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex -space-x-3 mb-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                    USER
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                Join 10,000+ Indian families saving on medicines
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Plan Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {Object.values(PLANS).map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative flex flex-col p-8 md:p-10 rounded-[3rem] bg-white transition-all duration-300 border-2 ${
                plan.highlight 
                  ? 'border-slate-900 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] scale-105 z-10' 
                  : 'border-slate-100 hover:border-slate-300 shadow-sm'
              }`}
            >
              {plan.badge && (
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl ${
                  plan.highlight ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 border border-slate-100'
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-slate-900">{plan.price_display}</span>
                  {plan.billing && <span className="text-slate-400 font-bold">/{plan.billing === 'per year' ? 'year' : 'mo'}</span>}
                </div>
                {'price_strikethrough' in plan && plan.price_strikethrough && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-slate-400 line-through font-bold">{plan.price_strikethrough}</span>
                    <span className="text-green-600 font-black text-xs uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded">
                      {'savings_percent' in plan ? plan.savings_percent : ''}
                    </span>
                  </div>
                )}
                {'savings_amount' in plan && plan.savings_amount && (
                  <div className="mt-2 text-green-600 font-black text-xs uppercase tracking-widest bg-green-50 px-3 py-1 rounded inline-block">
                    {plan.savings_amount}
                  </div>
                )}
              </div>

              <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  {plan.scans_label}
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-slate-600 font-medium leading-tight">{feature}</span>
                  </li>
                ))}
                {plan.not_included.map((feature, fIdx) => (
                  <li key={`not-${fIdx}`} className="flex items-start gap-3 opacity-40">
                    <X className="w-5 h-5 text-slate-300 mt-0.5 shrink-0" />
                    <span className="text-slate-400 font-medium leading-tight line-through">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => navigate(plan.price_inr === 0 ? '/' : '/scan')}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${
                  plan.highlight 
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl' 
                    : 'bg-white text-slate-900 border-2 border-slate-200 hover:border-slate-900'
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Savings Calculator Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 md:p-16 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16" />
          
          <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
            <div className="w-24 h-24 bg-green-100 rounded-3xl flex items-center justify-center shrink-0">
              <Calculator className="w-12 h-12 text-green-600" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Smart Savings Calculator</h2>
              <p className="text-lg text-slate-500 font-medium mb-8">
                Medicine errors cost the average Indian family ₹15,000 yearly. Avoid them with AI scanning.
              </p>
              
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem]">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-black text-slate-900 text-lg uppercase tracking-tight">Potential Medicine Errors</span>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSavingsValue(Math.max(1, savingsValue - 1))}
                      className="w-10 h-10 bg-white border border-slate-200 rounded-xl font-black hover:border-slate-900"
                    >-</button>
                    <span className="text-2xl font-black text-slate-900 w-8 text-center">{savingsValue}</span>
                    <button 
                      onClick={() => setSavingsValue(savingsValue + 1)}
                      className="w-10 h-10 bg-white border border-slate-200 rounded-xl font-black hover:border-slate-900"
                    >+</button>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">If you avoid {savingsValue} wrong medicine this year...</span>
                  <span className="text-3xl font-black text-green-600">You save ₹{(savingsValue * 10000).toLocaleString()} +</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accuracy Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Scanner Accuracy Comparison</h2>
          <p className="text-slate-500 font-medium">Why upgrading to the Family Plan makes sense for your safety.</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[3rem] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Feature</th>
                <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Basic (Free)</th>
                <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-900">Family Plan</th>
              </tr>
            </thead>
            <tbody>
              {accuracyData.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 font-bold text-slate-700">{row.feature}</td>
                  <td className="px-8 py-6 font-bold text-slate-400">{row.basic}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        {row.family === '99%' ? <Star className="w-4 h-4 fill-current" /> : <Check className="w-4 h-4" />}
                      </span>
                      <span className="font-black text-slate-900">{row.family}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-12 flex flex-col items-center gap-6">
          <p className="text-slate-400 font-medium text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> CDSCO and AI Safety Verified Standards
          </p>
          <div className="flex items-center gap-8 opacity-40 grayscale h-8">
            {/* Logos/Trust icons could go here */}
            <Users className="w-8 h-8" />
            <ShieldCheck className="w-8 h-8" />
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </section>
    </div>
  );
};
