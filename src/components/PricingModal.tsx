import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PLANS } from '../config/plans';
import { X, Check, Loader2, Star } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { user, profile, openAuthModal, updateSubscription } = useAuth();
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
      savings_amount: billingCycle === 'yearly' ? 'Save ₹489 Year' : null,
      savings_percent: billingCycle === 'monthly' ? 'Save 50%' : 'Save 26%',
    }
  ];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleCheckout = async (planId: string) => {
    if (planId === 'basic') {
      onClose();
      return;
    }

    if (!user) {
      onClose();
      openAuthModal();
      return;
    }

    setIsProcessing(planId);

    try {
      // 1. Create order on server
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: billingCycle,
          planId: planId
        }),
      });

      if (!response.ok) throw new Error('Order creation failed');
      const { order } = await response.json();

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_dummy", // Enter the Key ID generated from the Dashboard
        amount: order.amount,
        currency: order.currency,
        name: "Aethelcare India",
        description: `Subscription for ${planId} plan`,
        image: "/favicon.svg",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on server
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            const result = await verifyRes.json();
            if (result.success) {
              // 4. Update user profile - calculate expiry
              const expiryDate = new Date();
              expiryDate.setMonth(expiryDate.getMonth() + 1);
              
              await updateSubscription(planId, expiryDate.toISOString());
              
              alert("Payment successful! You are now a Premium member.");
              onClose();
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            console.error(err);
            alert("Something went wrong during verification.");
          } finally {
            setIsProcessing(null);
          }
        },
        prefill: {
          name: profile?.displayName || "",
          email: user.email || "",
          contact: profile?.phoneNumber || ""
        },
        theme: {
          color: "#4f46e5",
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setIsProcessing(null);
        console.error(response.error);
        alert(response.error.description);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Failed to initiate payment. Please try again.");
      setIsProcessing(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-7xl bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              No hidden fees. Understand your health and manage your family's care with confidence.
            </p>

            <div className="flex flex-col items-center gap-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100">
                <Star className="w-4 h-4 fill-current" /> 14-Day Free Trial Available
              </div>

              {/* Toggle */}
              <div className="bg-gray-100 p-1 rounded-xl flex items-center relative w-64">
                <button 
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-widest transition-all relative z-10 ${
                    billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-widest transition-all relative z-10 ${
                    billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  Yearly
                </button>
                <motion.div 
                  className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-gray-900 rounded-lg shadow-sm"
                  animate={{ x: billingCycle === 'monthly' ? 0 : '100%' }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan: any, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex flex-col relative bg-white rounded-3xl border-2 ${
                  plan.highlight 
                    ? 'border-indigo-600 shadow-xl shadow-indigo-500/10 scale-105 z-10' 
                    : 'border-gray-100 shadow-sm hover:border-gray-200'
                } p-8`}
              >
                {plan.badge && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg ${
                      plan.highlight ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 border border-gray-100'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-gray-900">
                      {plan.price_display}
                    </span>
                    {plan.billing && (
                      <span className="text-sm text-gray-500 font-bold">/{plan.billing === 'per year' ? 'year' : 'mo'}</span>
                    )}
                  </div>
                  {'price_strikethrough' in plan && plan.price_strikethrough && (
                    <p className="text-xs text-gray-400 line-through font-bold mt-1">{plan.price_strikethrough}</p>
                  )}
                  {'savings_amount' in plan && plan.savings_amount && (
                    <p className="text-xs font-black text-green-600 uppercase tracking-widest mt-1">{plan.savings_amount}</p>
                  )}
                </div>

                <div className="mb-6">
                  <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 rounded-lg py-1.5 px-3 uppercase tracking-widest border border-indigo-100 inline-block">
                    {plan.scans_label}
                  </p>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <Check className="w-5 h-5 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.not_included.map((feature, idx) => (
                    <li key={`not-${idx}`} className="flex items-start gap-3 text-sm text-gray-300">
                      <X className="w-5 h-5 shrink-0" />
                      <span className="line-through">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={isProcessing === plan.id}
                  className={`w-full py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95'
                      : 'bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 active:scale-95'
                  } disabled:opacity-50`}
                >
                  {isProcessing === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    plan.cta
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
