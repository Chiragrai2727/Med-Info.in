import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useLanguage } from '../LanguageContext';
import { Link } from 'react-router-dom';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, updateSubscription, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const PLANS = [
    {
      id: 'daily',
      name: t('oneTimePass'),
      description: t('oneTimePassDesc'),
      price: 99,
      originalPrice: 99,
      duration: t('day'),
      features: [t('unlimitedScanning'), t('prescriptionAnalysis'), t('labReportAnalysis'), t('valid24Hours')]
    },
    {
      id: 'monthly',
      name: t('monthlyPro'),
      description: t('monthlyProDesc'),
      price: 79,
      originalPrice: 99,
      duration: t('month'),
      features: [t('unlimitedScanning'), t('prescriptionAnalysis'), t('labReportAnalysis'), t('prioritySupport')],
      popular: true
    },
    {
      id: 'yearly',
      name: t('yearlyPremium'),
      description: t('yearlyPremiumDesc'),
      price: 849,
      originalPrice: 948,
      duration: t('year'),
      features: [t('unlimitedScanning'), t('prescriptionAnalysis'), t('labReportAnalysis'), t('prioritySupport'), t('earlyAccess')]
    }
  ];

  if (!isOpen) return null;

  const plan = PLANS.find(p => p.id === selectedPlan)!;
  const gst = plan.price * 0.18;
  const platformFee = plan.price * 0.02;
  const total = plan.price + gst + platformFee;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async () => {
    if (!user) {
      showToast('Please sign in to subscribe', 'error');
      openAuthModal();
      return;
    }

    setIsProcessing(true);

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId || keyId.includes('dummy')) {
      showToast('Frontend API Key missing. Please trigger a new deploy in Netlify.', 'error');
      setIsProcessing(false);
      return;
    }

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        showToast('Razorpay SDK failed to load. Are you online?', 'error');
        setIsProcessing(false);
        return;
      }

      // Create order on backend
      const orderResponse = await fetch('/.netlify/functions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${orderResponse.status}`);
      }

      const { order } = await orderResponse.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy',
        amount: order.amount,
        currency: order.currency,
        name: 'MedInfo India',
        description: `${plan.name} Subscription`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/.netlify/functions/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyResult = await verifyResponse.json().catch(() => ({}));

            if (!verifyResponse.ok) {
              throw new Error(verifyResult.message || verifyResult.error || `Verification failed: ${verifyResponse.status}`);
            }

            if (verifyResult.success) {
              // Calculate expiry
              const now = new Date();
              if (selectedPlan === 'daily') now.setDate(now.getDate() + 1);
              else if (selectedPlan === 'monthly') now.setMonth(now.getMonth() + 1);
              else if (selectedPlan === 'yearly') now.setFullYear(now.getFullYear() + 1);

              await updateSubscription(selectedPlan as any, now.toISOString());
              
              // Record payment history
              try {
                await addDoc(collection(db, 'users', user.uid, 'payments'), {
                  amount: order.amount / 100,
                  tier: selectedPlan,
                  date: new Date().toISOString(),
                  status: 'success',
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id
                });
              } catch (e) {
                console.error('Failed to record payment history', e);
              }

              showToast('Subscription activated successfully!', 'success');
              onClose();
            } else {
              showToast(verifyResult.message || 'Payment verification failed', 'error');
            }
          } catch (err: any) {
            console.error(err);
            showToast(err.message || 'Error verifying payment', 'error');
          }
        },
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
        },
        theme: {
          color: '#000000'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        showToast(response.error.description || 'Payment failed', 'error');
        setIsProcessing(false);
      });
      rzp.open();

    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{t('unlockAIScanner')}</h2>
              <p className="text-gray-500 font-medium mt-1">{t('chooseAPlan')}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 sm:p-8 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 lg:px-4 py-4">
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`relative cursor-pointer rounded-3xl border-2 p-6 transition-all flex flex-col ${
                    selectedPlan === p.id 
                      ? 'border-black bg-black text-white shadow-2xl scale-105 z-10' 
                      : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-md text-gray-900 scale-100'
                  }`}
                >
                  {p.popular && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      selectedPlan === p.id ? 'bg-white text-black' : 'bg-black text-white'
                    }`}>
                      {t('mostPopular')}
                    </div>
                  )}
                  
                  <h3 className="text-xl font-black mb-2">{p.name}</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-black">₹{p.price}</span>
                    <span className={`text-sm font-medium ${selectedPlan === p.id ? 'text-gray-300' : 'text-gray-500'}`}>/{p.duration}</span>
                  </div>
                  
                  <div className={`text-sm font-medium mb-6 line-through min-h-[20px] ${selectedPlan === p.id ? 'text-gray-400' : 'text-gray-400'}`}>
                    {p.originalPrice > p.price ? `₹${p.originalPrice}/${p.duration}` : ''}
                  </div>

                  <ul className="space-y-3 mt-auto">
                    {p.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm font-medium">
                        <Check className={`w-5 h-5 shrink-0 ${selectedPlan === p.id ? 'text-green-400' : 'text-green-500'}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {profile && !profile.trialClaimed && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl p-6 sm:p-8 w-full border border-purple-100 flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-left mb-8 shadow-sm">
                  <div>
                    <h3 className="text-xl font-bold text-purple-900 mb-1">Looking for the 14-Day Free Trial?</h3>
                    <p className="text-purple-700 text-sm mb-4 md:mb-0">Claim your free access by verifying your phone number.</p>
                  </div>
                  <Link to="/dashboard" onClick={onClose} className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition shadow-sm whitespace-nowrap">
                    Verify & Claim
                  </Link>
                </div>
            )}

            <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto border border-gray-100">
              <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 text-center">{t('breakdown')}</h4>
              
              <div className="space-y-4 text-sm font-medium text-gray-600">
                <div className="flex justify-between items-center">
                  <span>{plan.name} {t('plan')}</span>
                  <span className="text-gray-900 font-bold">₹{plan.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t('platformFee')} (2%)</span>
                  <span className="text-gray-900 font-bold">₹{platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t('gst')} (18%)</span>
                  <span className="text-gray-900 font-bold">₹{gst.toFixed(2)}</span>
                </div>
                
                <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-lg">
                  <span className="font-black text-gray-900">{t('totalAmount')}</span>
                  <span className="font-black text-black">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full mt-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    {t('paySecurely').replace('{total}', total.toFixed(2))}
                  </>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 font-medium mt-4 flex items-center justify-center gap-1">
                {t('securedByRazorpay')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
