import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Shield, Zap, CreditCard, Loader2, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

export const PremiumPaywall: React.FC<{ onSuccess: () => void, onClose: () => void }> = ({ onSuccess, onClose }) => {
  const { upgradeToPremium } = useAuth();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing delay
    setTimeout(async () => {
      try {
        await upgradeToPremium();
        showToast('Payment successful! Welcome to Pro.', 'success');
        onSuccess();
      } catch (error) {
        showToast('Payment failed. Please try again.', 'error');
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-white/50 rounded-full transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="p-8 bg-gradient-to-br from-yellow-50 to-orange-50 text-center">
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-yellow-200">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Unlock Pro Features</h2>
          <p className="text-gray-600 font-medium">Get the most out of your health data.</p>
        </div>

        <div className="p-8">
          <div className="flex items-baseline justify-center gap-2 mb-8">
            <span className="text-5xl font-black text-gray-900">₹1</span>
            <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">/ Lifetime</span>
          </div>

          <ul className="space-y-4 mb-8">
            {[
              'Personalized Medication Timetable',
              'Unlimited AI Medication Scanning',
              'Ad-free experience',
              'Priority support'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors shadow-xl disabled:opacity-70"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" /> Pay ₹1 Now
              </>
            )}
          </button>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
            <Shield className="w-4 h-4" />
            Secure simulated payment for MVP
          </div>
        </div>
      </motion.div>
    </div>
  );
};
