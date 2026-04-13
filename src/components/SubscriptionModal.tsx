import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLANS = [
  {
    id: 'daily',
    name: 'One-Time Pass',
    description: '24 hours of unlimited scanning',
    price: 99,
    originalPrice: 99,
    duration: 'day',
    features: ['Unlimited AI Scanning', 'Prescription Analysis', 'Lab Report Analysis', 'Valid for 24 hours']
  },
  {
    id: 'monthly',
    name: 'Monthly Pro',
    description: 'Perfect for regular health monitoring',
    price: 79,
    originalPrice: 99,
    duration: 'month',
    features: ['Unlimited AI Scanning', 'Prescription Analysis', 'Lab Report Analysis', 'Priority Support'],
    popular: true
  },
  {
    id: 'yearly',
    name: 'Yearly Premium',
    description: 'Best value for long-term care',
    price: 849,
    originalPrice: 948,
    duration: 'year',
    features: ['Unlimited AI Scanning', 'Prescription Analysis', 'Lab Report Analysis', 'Priority Support', 'Early Access to Features']
  }
];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { user, updateSubscription, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

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
      const orderResponse = await fetch('/.netlify/functions/api/create-order', {
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
            const verifyResponse = await fetch('/.netlify/functions/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyResult = await verifyResponse.json();

            if (verifyResult.success) {
              // Calculate expiry
              const now = new Date();
              if (selectedPlan === 'daily') now.setDate(now.getDate() + 1);
              else if (selectedPlan === 'monthly') now.setMonth(now.getMonth() + 1);
              else if (selectedPlan === 'yearly') now.setFullYear(now.getFullYear() + 1);

              await updateSubscription(selectedPlan as any, now.toISOString());
              showToast('Subscription activated successfully!', 'success');
              onClose();
            } else {
              showToast('Payment verification failed', 'error');
            }
          } catch (err) {
            console.error(err);
            showToast('Error verifying payment', 'error');
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
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Unlock AI Health Scanner</h2>
              <p className="text-gray-500 font-medium mt-1">Choose a plan to access unlimited scanning features</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 sm:p-8 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`relative cursor-pointer rounded-3xl border-2 p-6 transition-all ${
                    selectedPlan === p.id 
                      ? 'border-black bg-black text-white shadow-xl scale-105 z-10' 
                      : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-md text-gray-900'
                  }`}
                >
                  {p.popular && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      selectedPlan === p.id ? 'bg-white text-black' : 'bg-black text-white'
                    }`}>
                      Most Popular
                    </div>
                  )}
                  
                  <h3 className="text-xl font-black mb-2">{p.name}</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-black">₹{p.price}</span>
                    <span className={`text-sm font-medium ${selectedPlan === p.id ? 'text-gray-300' : 'text-gray-500'}`}>/{p.duration}</span>
                  </div>
                  
                  {p.originalPrice > p.price && (
                    <div className={`text-sm font-medium mb-6 line-through ${selectedPlan === p.id ? 'text-gray-400' : 'text-gray-400'}`}>
                      ₹{p.originalPrice}/{p.duration}
                    </div>
                  )}

                  <ul className="space-y-3">
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

            <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto border border-gray-100">
              <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 text-center">Payment Breakdown</h4>
              
              <div className="space-y-4 text-sm font-medium text-gray-600">
                <div className="flex justify-between items-center">
                  <span>{plan.name} Plan</span>
                  <span className="text-gray-900 font-bold">₹{plan.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Platform Fee (2%)</span>
                  <span className="text-gray-900 font-bold">₹{platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>GST (18%)</span>
                  <span className="text-gray-900 font-bold">₹{gst.toFixed(2)}</span>
                </div>
                
                <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-lg">
                  <span className="font-black text-gray-900">Total Amount</span>
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
                    Pay ₹{total.toFixed(2)} Securely
                  </>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 font-medium mt-4 flex items-center justify-center gap-1">
                Secured by Razorpay
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
