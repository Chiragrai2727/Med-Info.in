import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useLanguage } from '../LanguageContext';
import { Link } from 'react-router-dom';
import { PLANS } from '../config/plans';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, updateSubscription, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('premium');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const plan = (PLANS as any)[selectedPlanId];
  const amount = plan.price_inr;

  const handleSubscribe = async () => {
    if (!user) {
      showToast('Please sign in to subscribe', 'error');
      openAuthModal();
      return;
    }

    if (amount === 0) {
      showToast('This plan is already free!', 'info');
      onClose();
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create order on server
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: 'monthly',
          planId: selectedPlanId
        })
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
        name: 'Aethelcare India',
        description: `${plan.name} Subscription`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // 2. Verify payment on server
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response)
            });

            const verifyResult = await verifyResponse.json().catch(() => ({}));

            if (!verifyResponse.ok) {
              throw new Error(verifyResult.message || verifyResult.error || `Verification failed: ${verifyResponse.status}`);
            }

            if (verifyResult.success) {
              // 3. Update profile
              const expiryDate = new Date();
              expiryDate.setMonth(expiryDate.getMonth() + 1);

              await updateSubscription(selectedPlanId, expiryDate.toISOString());
              
              // 4. Record payment history
              try {
                await addDoc(collection(db, 'users', user.uid, 'payments'), {
                  amount: amount,
                  tier: selectedPlanId,
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
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: profile?.displayName || '',
          email: user.email || '',
        },
        theme: {
          color: '#4f46e5'
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
      setIsProcessing(false);
    }
  };

  const planOptions = [PLANS.basic, PLANS.premium];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Unlock Premium Care</h2>
              <p className="text-gray-500 font-medium mt-1">Choose a plan that fits your family's needs</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 sm:p-8 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-4">
              {planOptions.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`relative cursor-pointer rounded-3xl border-2 p-6 transition-all flex flex-col ${
                    selectedPlanId === p.id 
                      ? 'border-indigo-600 bg-indigo-50/30 shadow-indigo-100 shadow-lg scale-105 z-10' 
                      : 'border-gray-100 bg-white hover:border-gray-300 text-gray-900 scale-100'
                  }`}
                >
                  {p.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white">
                      {p.badge}
                    </div>
                  )}
                  
                  <h3 className="text-xl font-black mb-2">{p.name}</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-black">
                      {p.price_display}
                    </span>
                    <span className="text-sm font-medium text-gray-500">/{p.billing === 'per year' ? 'year' : 'month'}</span>
                  </div>
                  
                  {'savings_amount' in p && p.savings_amount && (
                    <div className="text-xs font-bold text-green-600 mb-6">
                      {p.savings_amount}
                    </div>
                  )}

                  <ul className="space-y-3 mt-4">
                    {p.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm font-medium">
                        <Check className="w-5 h-5 shrink-0 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {profile && !profile.trialClaimed && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-6 w-full border border-indigo-100 flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-left mb-8 shadow-sm">
                  <div>
                    <h3 className="text-xl font-bold text-indigo-900 mb-1">Claim your 14-Day Free Trial</h3>
                    <p className="text-indigo-700 text-sm">Verify your phone number to get instant access.</p>
                  </div>
                  <Link to="/dashboard" onClick={onClose} className="mt-4 md:mt-0 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm whitespace-nowrap">
                    Verify & Claim
                  </Link>
                </div>
            )}

            <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto border border-gray-100">
              <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 text-center">Checkout Summary</h4>
              
              <div className="space-y-4 text-sm font-medium text-gray-600">
                <div className="flex justify-between items-center">
                  <span>{plan.name}</span>
                  <span className="text-gray-900 font-bold">₹{amount.toFixed(2)}</span>
                </div>
                
                <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-lg">
                  <span className="font-black text-gray-900">Total Amount</span>
                  <span className="font-black text-black">₹{amount.toFixed(2)}</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Pay ₹{amount.toFixed(2)} Securely
                  </>
                )}
              </motion.button>
              <p className="text-center text-xs text-gray-400 font-medium mt-4">
                Secured by Razorpay • Instant activation
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
