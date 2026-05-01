import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { PLANS } from '../config/plans';
import { Check, X, ShieldCheck, Zap, Star, Phone, ArrowRight, Calculator, IndianRupee, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { loadScript } from '../lib/scripts';

export const Pricing: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile, openAuthModal, updateSubscription } = useAuth();
  const { showToast } = useToast();
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
      // Load Razorpay dynamically
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      
      const response = await fetch('/.netlify/functions/create-order', {
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
          const verifyRes = await fetch('/.netlify/functions/verify-payment', {
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
            showToast('Payment Successful! Welcome to ' + planId.charAt(0).toUpperCase() + planId.slice(1) + '.', 'success');
          } else {
            showToast('Payment verification failed.', 'error');
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
      showToast(`Payment failed to start: ${error.message || 'Please check your connection and API keys.'}`, 'error');
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
    <div className="min-h-screen pt-40 pb-24 bg-transparent pt-[calc(10rem+env(safe-area-inset-top))]">
      <Helmet>
        <title>Pricing Plans - Aethelcare India Premium Health Intelligence</title>
        <meta name="description" content="Choose the best plan for your family's health and safety. Get access to 99% accurate AI prescription scanning, clinical reports, and CDSCO drug safety alerts in India." />
        <meta name="keywords" content="Aethelcare pricing, medicine scanner subscription India, premium drug safety alerts India, CDSCO verified medicines scanner" />
        <link rel="canonical" href="https://aethelcare.xyz/pricing" />
      </Helmet>
 
      {/* Hero / Free Trial Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-3xl bg-dark-bg p-12 md:p-24 rounded-[5rem] text-center text-white relative overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.1)] border-2 border-dark-surface"
        >
          {/* Background Decorative Circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -mr-48 -mt-48 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-success/10 rounded-full -ml-48 -mb-48 blur-[100px]" />
 
          <div className="relative z-10 max-w-4xl mx-auto">
            <span className="inline-flex items-center gap-2 px-6 py-2.5 backdrop-blur-md bg-white/10 text-primary text-[10px] font-black uppercase tracking-[0.25em] rounded-full mb-10 border border-white/5">
              <Zap className="w-4 h-4 fill-current" /> Limited Time Trial
            </span>
            <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-[-0.05em] leading-[0.8]">
              Try Premium free for 14 days
            </h1>
            <p className="text-xl md:text-3xl text-text-secondary font-bold mb-14 tracking-tight leading-tight">
              Verify with your phone, no credit card needed. Get instant access to the top-tier 99% accuracy scanner.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-16">
              <button 
                onClick={handleClaimTrial}
                className="px-12 py-6 bg-surface text-text-primary rounded-[2rem] font-black text-lg uppercase tracking-widest hover:bg-bg transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] flex items-center gap-3 active:scale-95"
              >
                Claim Free Trial <ArrowRight className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3 text-text-secondary font-black uppercase tracking-[0.2em] text-[10px]">
                <Phone className="w-5 h-5" /> Phone Verified Only
              </div>
            </div>
 
            <div className="flex flex-col items-center gap-6">
              <div className="flex -space-x-4 mb-2">
                {[11, 25, 33, 48, 52].map(i => (
                  <img 
                    key={i} 
                    src={`https://i.pravatar.cc/120?u=${i}`} 
                    alt="Verified User" 
                    className="w-14 h-14 rounded-full border-4 border-dark-bg bg-dark-surface object-cover shadow-xl"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <p className="text-xs font-black text-text-secondary uppercase tracking-[0.3em]">
                Join 10,000+ Indian families saving on meds
              </p>
            </div>
          </div>
        </motion.div>
      </section>
 
      {/* Toggle Section */}
      <section className="max-w-7xl mx-auto px-4 mb-20 flex justify-center">
        <div className="backdrop-blur-xl bg-surface/70 p-2 rounded-[2rem] border-2 border-surface flex items-center shadow-sm relative">
          <button 
            onClick={() => setBillingCycle('monthly')}
            className={`px-12 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all relative z-10 ${
              billingCycle === 'monthly' ? 'text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setBillingCycle('yearly')}
            className={`px-12 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all relative z-10 ${
              billingCycle === 'yearly' ? 'text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Yearly
          </button>
          <motion.div 
            initial={false}
            animate={{ x: billingCycle === 'monthly' ? 0 : '100%' }}
            className="absolute inset-y-2 left-2 w-[calc(50%-8px)] bg-dark-bg rounded-[1.5rem] shadow-xl"
          />
          
          {billingCycle === 'yearly' && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-success text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap shadow-lg border border-success/20"
            >
              SAVE ₹489 YEARLY
            </motion.div>
          )}
        </div>
      </section>
 
      {/* Plan Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -12 }}
              className={`relative flex flex-col p-12 md:p-16 rounded-[4.5rem] backdrop-blur-xl transition-all duration-700 border-2 ${
                plan.highlight 
                  ? 'bg-surface/90 border-dark-bg shadow-[0_40px_100px_rgba(0,0,0,0.1)] z-10' 
                  : 'bg-surface/60 border-surface hover:border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)]'
              }`}
            >
              {plan.badge && (
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl ${
                  plan.highlight ? 'bg-dark-bg text-white' : 'backdrop-blur-md bg-surface text-text-primary border border-border'
                }`}>
                  {plan.badge}
                </div>
              )}
 
              <div className="mb-10">
                <h3 className="text-3xl font-black text-text-primary mb-4 tracking-tight uppercase leading-none">{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black text-text-primary tracking-[-0.05em] leading-none">{plan.price_display}</span>
                  {plan.billing && <span className="text-text-secondary font-black uppercase tracking-widest text-xs opacity-60">/{plan.billing === 'per year' ? 'year' : 'mo'}</span>}
                </div>
                {'price_strikethrough' in plan && plan.price_strikethrough && (
                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-text-secondary/30 line-through font-black text-xl tracking-tight leading-none">{plan.price_strikethrough}</span>
                    <span className="text-success font-black text-[10px] uppercase tracking-widest bg-success/5 px-3 py-1 rounded-lg border border-success/10">
                      {'savings_percent' in plan ? plan.savings_percent : ''}
                    </span>
                  </div>
                )}
                {'savings_amount' in plan && plan.savings_amount && (
                  <div className="mt-4 text-success font-black text-[10px] uppercase tracking-widest bg-success/5 px-4 py-1.5 rounded-full border border-success/10 inline-block shadow-sm">
                    {plan.savings_amount}
                  </div>
                )}
              </div>
 
              <div className="mb-10 p-6 backdrop-blur-md bg-dark-bg/5 rounded-[2rem] border border-surface/50 shadow-inner">
                <div className="flex items-center gap-4 text-text-primary font-black text-xs uppercase tracking-[0.2em] leading-none">
                  <div className="p-2.5 bg-primary rounded-xl shadow-lg shadow-primary/20">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  {plan.scans_label}
                </div>
              </div>
 
              <ul className="space-y-6 mb-12 flex-1">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 bg-success/10 backdrop-blur-md border border-success/20 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-success" strokeWidth={3} />
                    </div>
                    <span className="text-text-secondary font-bold text-lg tracking-tight leading-none pt-0.5">{feature}</span>
                  </li>
                ))}
                {plan.not_included.map((feature, fIdx) => (
                  <li key={`not-${fIdx}`} className="flex items-start gap-4 opacity-30">
                    <X className="w-6 h-6 text-text-secondary/40 mt-0.5 shrink-0" />
                    <span className="text-text-secondary font-bold text-lg tracking-tight leading-none pt-0.5 line-through">{feature}</span>
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
                className={`w-full py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-2xl ${
                  plan.highlight 
                    ? 'bg-dark-bg text-white hover:opacity-90' 
                    : 'bg-surface/80 text-text-primary border-2 border-surface hover:bg-surface'
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </section>
 
      {/* Savings Calculator Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="backdrop-blur-xl bg-surface/70 border-2 border-surface rounded-[5rem] p-12 md:p-20 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)] group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-success/5 rounded-full -mr-24 -mt-24 blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-1000" />
          
          <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
            <div className="w-28 h-28 bg-success/10 backdrop-blur-md border border-success/20 rounded-[2.5rem] flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-12 transition-transform duration-700">
              <Calculator className="w-14 h-14 text-success" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-black text-text-primary mb-6 tracking-[-0.04em] leading-none uppercase">Smart Savings Calculator</h2>
              <p className="text-xl text-text-secondary font-bold mb-10 tracking-tight leading-relaxed max-w-2xl">
                Medicine errors cost the average Indian family ₹15,000 yearly. Avoid them with expert AI scanning.
              </p>
              
              <div className="p-10 backdrop-blur-md bg-dark-bg/5 border border-surface rounded-[3rem] shadow-inner">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-8">
                  <span className="font-black text-text-primary text-xl uppercase tracking-widest leading-none">Avoidable Medical Errors</span>
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setSavingsValue(Math.max(1, savingsValue - 1))}
                      className="w-12 h-12 backdrop-blur-md bg-surface border border-border rounded-2xl font-black text-xl flex items-center justify-center hover:border-dark-bg transition-all active:scale-90"
                    >-</button>
                    <span className="text-4xl font-black text-text-primary w-10 text-center tracking-tighter">{savingsValue}</span>
                    <button 
                      onClick={() => setSavingsValue(savingsValue + 1)}
                      className="w-12 h-12 backdrop-blur-md bg-surface border border-border rounded-2xl font-black text-xl flex items-center justify-center hover:border-dark-bg transition-all active:scale-90"
                    >+</button>
                  </div>
                </div>
                <div className="pt-8 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <span className="text-text-secondary font-black uppercase tracking-[0.25em] text-[10px]">Estimated Medical Recovery Savings:</span>
                  <span className="text-5xl font-black text-success tracking-[-0.05em] leading-none">₹{(savingsValue * 10000).toLocaleString()} +</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
 
      {/* Accuracy Table */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-text-primary mb-6 tracking-[-0.04em] leading-none uppercase">Scanner Benchmarks</h2>
          <p className="text-xl text-text-secondary font-bold tracking-tight">Why upgrading to Premium is a safety mandate for your home.</p>
        </div>
 
        <div className="backdrop-blur-xl bg-surface/70 border-2 border-surface rounded-[4rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-bg/50 border-b border-border">
                <th className="px-12 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-text-secondary">Analysis Type</th>
                <th className="px-12 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-text-secondary">Basic Scanner</th>
                <th className="px-12 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-text-primary">Premium AI-Vision</th>
              </tr>
            </thead>
            <tbody className="text-lg">
              {accuracyData.map((row: any, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                  <td className="px-12 py-8 font-black text-text-secondary tracking-tight">{row.feature}</td>
                  <td className="px-12 py-8 font-bold text-text-secondary/40 italic tracking-tight">{row.basic}</td>
                  <td className="px-12 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 backdrop-blur-md bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shadow-sm">
                        {row.premium === '99%' ? <Star className="w-5 h-5 fill-current" /> : <Check className="w-5 h-5" />}
                      </div>
                      <span className="font-black text-text-primary tracking-tight text-xl">{row.premium}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-20 flex flex-col items-center gap-8">
          <div className="px-8 py-3 backdrop-blur-md bg-surface border border-border rounded-full text-text-secondary font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-primary" /> CDSCO & AI SAFETY VERIFIED STANDARDS
          </div>
          <div className="flex items-center gap-12 opacity-20 grayscale h-10 transition-opacity hover:opacity-100 duration-1000">
            <Users className="w-10 h-10" />
            <ShieldCheck className="w-10 h-10" />
            <IndianRupee className="w-8 h-8" />
          </div>
        </div>
      </section>
    </div>
  );
};
