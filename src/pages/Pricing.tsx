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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      ...PLANS.basic,
      price_display: '₹0',
      billing: null,
    },
    {
      ...PLANS.premium,
      price_display: billingCycle === 'monthly' ? '₹99' : '₹699',
      billing: billingCycle === 'monthly' ? 'per month' : 'per year',
      price_strikethrough: billingCycle === 'monthly' ? '₹199' : '₹948',
      savings_amount: billingCycle === 'yearly' ? 'Save ₹489' : null,
      savings_percent: billingCycle === 'monthly' ? 'Save 50%' : 'Save 26%',
    }
  ];

  const handlePayment = async (planId: string) => {
    if (!user) {
      openAuthModal();
      return;
    }

    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          plan: billingCycle,
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.order) {
         throw new Error(data.details || data.error || 'Order creation failed');
      }

      const options = {
        key: data.key_id || "rzp_test_dummy",
        amount: data.order.amount,
        currency: "INR",
        name: "Aethelcare Premium",
        description: `Upgrade to ${planId.toUpperCase()} Plan`,
        order_id: data.order.id,
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            if (updateSubscription) {
              const expiryDate = new Date();
              if (billingCycle === 'yearly') {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
              } else {
                expiryDate.setMonth(expiryDate.getMonth() + 1);
              }
              updateSubscription(planId, expiryDate.toISOString());
            }
            navigate('/dashboard');
            alert('Payment Successful! Welcome to ' + planId.charAt(0).toUpperCase() + planId.slice(1) + '.');
          } else {
            alert('Payment verification failed.');
          }
        },
        prefill: {
          name: profile?.displayName || "",
          email: user.email || "",
          contact: "",
        },
        theme: {
          color: "#2563EB",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Payment Error:', error);
      alert(`Payment failed to start: ${error.message || 'Please check your connection and API keys.'}`);
    }
  };

  const handleClaimTrial = () => {
    if (!user) {
      openAuthModal();
    } else {
      // Redirect to dashboard where the user can enter their phone number to claim the trial
      navigate('/dashboard');
    }
  };

  const accuracyData = [
    { feature: 'Printed prescriptions', basic: '75-80%', premium: '99%' },
    { feature: 'Handwritten prescriptions', basic: 'Not available', premium: '99%' },
    { feature: 'Lab reports', basic: 'Not available', premium: '99%' },
    { feature: 'Blurry/dark photos', basic: 'Not available', premium: '99%' },
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
              Try Premium free for 14 days
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
                {[11, 25, 33, 48, 52].map(i => (
                  <img 
                    key={i} 
                    src={`https://i.pravatar.cc/100?u=${i}`} 
                    alt="Verified User" 
                    className="w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                Join 10,000+ Indian families saving on medicines
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Toggle Section */}
      <section className="max-w-7xl mx-auto px-4 mb-12 flex justify-center">
        <div className="bg-white p-1.5 rounded-2xl border-2 border-slate-100 flex items-center shadow-sm relative">
          <button 
            onClick={() => setBillingCycle('monthly')}
            className={`px-8 py-3 rounded-xl font-black text-sm transition-all relative z-10 ${
              billingCycle === 'monthly' ? 'text-white' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setBillingCycle('yearly')}
            className={`px-8 py-3 rounded-xl font-black text-sm transition-all relative z-10 ${
              billingCycle === 'yearly' ? 'text-white' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Yearly
          </button>
          <motion.div 
            initial={false}
            animate={{ x: billingCycle === 'monthly' ? 0 : '100%' }}
            className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] bg-slate-900 rounded-xl shadow-lg"
          />
          
          {billingCycle === 'yearly' && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border border-green-200"
            >
              Save ₹489 Yearly
            </motion.div>
          )}
        </div>
      </section>

      {/* Plan Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
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
                onClick={() => {
                  if (plan.price_inr === 0) {
                    navigate('/');
                  } else {
                    handlePayment(plan.id);
                  }
                }}
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
          <p className="text-slate-500 font-medium">Why upgrading to the Premium Plan makes sense for your safety.</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[3rem] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Feature</th>
                <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Basic (Free)</th>
                <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-900">Premium Plan</th>
              </tr>
            </thead>
            <tbody>
              {accuracyData.map((row: any, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 font-bold text-slate-700">{row.feature}</td>
                  <td className="px-8 py-6 font-bold text-slate-400">{row.basic}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        {row.premium === '99%' ? <Star className="w-4 h-4 fill-current" /> : <Check className="w-4 h-4" />}
                      </span>
                      <span className="font-black text-slate-900">{row.premium}</span>
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
