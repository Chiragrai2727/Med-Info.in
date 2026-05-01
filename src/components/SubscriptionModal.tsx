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
      const orderResponse = await fetch('/.netlify/functions/create-order', {
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
            const verifyResponse = await fetch('/.netlify/functions/verify-payment', {
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
          color: '#1D4ED8'
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
          <div className="p-6 sm:p-8 border-b border-border flex justify-between items-center bg-bg/50">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight uppercase leading-[0.9]">Unlock Premium Care</h2>
              <p className="text-text-secondary font-bold mt-2 uppercase text-[10px] tracking-[0.2em]">Choose a plan that fits your family's needs</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-text-secondary hover:text-text-primary hover:bg-bg rounded-2xl transition-all group"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <div className="p-6 sm:p-8 overflow-y-auto flex-1 scrollbar-hide">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-4">
              {planOptions.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`relative cursor-pointer rounded-[2.5rem] border-2 p-8 transition-all flex flex-col ${
                    selectedPlanId === p.id 
                      ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10 scale-105 z-10' 
                      : 'border-border bg-surface hover:border-text-secondary/20 text-text-primary scale-100'
                  }`}
                >
                  {p.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-xl shadow-primary/20">
                      {p.badge}
                    </div>
                  )}
                  
                  <h3 className="text-xl font-black mb-2 uppercase tracking-tight leading-none">{p.name}</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-black tracking-tighter">
                      {p.price_display}
                    </span>
                    <span className="text-xs font-black text-text-secondary/50 uppercase tracking-widest">/{p.billing === 'per year' ? 'year' : 'month'}</span>
                  </div>
                  
                  {'savings_amount' in p && p.savings_amount && (
                    <div className="text-[10px] font-black text-success uppercase tracking-widest mb-6">
                      {p.savings_amount}
                    </div>
                  )}
 
                  <ul className="space-y-4 mt-4">
                    {p.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm font-bold text-text-secondary group">
                        <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-success" />
                        </div>
                        <span className="leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
 
            {profile && !profile.trialClaimed && (
                <div className="bg-primary/5 rounded-[2.5rem] p-8 w-full border border-primary/10 flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-left mb-8 shadow-sm">
                  <div>
                    <h3 className="text-xl font-black text-primary mb-1 uppercase tracking-tight">Claim 14-Day Free Trial</h3>
                    <p className="text-text-secondary text-sm font-bold tracking-tight">Verify your phone number to get instant access.</p>
                  </div>
                  <Link to="/dashboard" onClick={onClose} className="mt-6 md:mt-0 px-8 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 whitespace-nowrap active:scale-95">
                    Verify & Claim
                  </Link>
                </div>
            )}
 
            <div className="bg-bg/50 rounded-[3rem] p-8 sm:p-10 max-w-2xl mx-auto border border-border">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary/40 mb-8 text-center">Checkout Summary</h4>
              
              <div className="space-y-4 text-sm font-bold text-text-secondary">
                <div className="flex justify-between items-center px-2">
                  <span className="uppercase tracking-tight">{plan.name}</span>
                  <span className="text-text-primary font-black">₹{amount.toFixed(2)}</span>
                </div>
                
                <div className="pt-6 border-t border-border flex justify-between items-center text-lg px-2">
                  <span className="font-black text-text-primary uppercase tracking-tight">Total Amount</span>
                  <span className="font-black text-primary text-2xl tracking-tighter">₹{amount.toFixed(2)}</span>
                </div>
              </div>
 
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full mt-10 py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm hover:bg-primary-hover transition-all shadow-2xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3"
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
              <p className="text-center text-[10px] text-text-secondary/40 font-black uppercase tracking-widest mt-6">
                Secured by Razorpay • Instant activation
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
