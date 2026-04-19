import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, AlertCircle, Loader2, PartyPopper } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';

export const PhoneTrialSetup: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaimTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10 || !user) return;
    
    setLoading(true);
    setError(null);

    // Basic validation to block obvious fake numbers (1234567890, 0000000000)
    // Indian mobile numbers must start with 6, 7, 8, or 9 and be exactly 10 digits long.
    const isValidIndianPhone = /^[6789]\d{9}$/.test(phoneNumber);
    if (!isValidIndianPhone) {
      setError("Please enter a valid 10-digit mobile number.");
      setLoading(false);
      return;
    }

    try {
      // Format phone number
      let formattedPhone = phoneNumber.replace(/\s+/g, '');
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone;
      }

      // Update profile with trial data directly - bypassing paid SMS since they already authenticated via Google
      const userRef = doc(db, 'users', user.uid);
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const trialStartedAt = new Date().toISOString();
      
      await updateDoc(userRef, {
        phoneNumber: formattedPhone,
        trialClaimed: true,
        trialStartedAt,
        trialEndsAt,
        trialExpiredSmsSent: false
      });

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to claim trial. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 sm:p-8 border border-blue-100">
      <div className="flex items-start gap-4 mb-6">
        <div className="bg-blue-600 rounded-full p-3 text-white shadow-sm mt-1">
          <PartyPopper className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Claim Your 14-Day Free Trial</h3>
          <p className="text-gray-600 text-sm mt-1 mb-4">
            Link your phone number to your Google account to instantly unlock complete access to the AI Medical Scanner.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 flex items-start gap-2 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleClaimTrial} className="max-w-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
            Phone / WhatsApp Number
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+91</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="9876543210"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium"
              required
              maxLength={10}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || phoneNumber.length < 10}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Instantly Claim Trial'}
        </button>
        <p className="text-xs text-gray-500 text-center mt-3 font-medium">
          No credit card required. Cancel anytime.
        </p>
      </form>
    </div>
  );
};
