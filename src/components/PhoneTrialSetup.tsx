import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, CheckCircle2, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';

export const PhoneTrialSetup: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Setup reCAPTCHA when component mounts
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    setError(null);
    try {
      // Format phone number. Adding +91 prefix for India if not present
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone;
      }

      // --- DEV BYPASS FOR TESTING ---
      if (formattedPhone === '+919999999999' || formattedPhone === '+19999999999') {
        setTimeout(() => {
           setStep('otp');
           // Attach a dummy confirmation result
           setConfirmationResult({
             verificationId: 'mock-id',
             confirm: async (code: string) => {
               if (code === '123456') {
                 return { user: auth.currentUser };
               }
               throw new Error("Invalid mock OTP. Use 123456.");
             }
           } as any);
        }, 800);
        return;
      }
      // ------------------------------

      // Ensure recaptcha verifier is present
      if (!window.recaptchaVerifier) {
         window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }

      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setStep('otp');
    } catch (err: any) {
      console.error("Firebase Phone Auth Error ->", err);
      
      // Critical: Reset Recaptcha if it fails, otherwise Firebase traps the user in an infinite error loop
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
      
      // Render Recaptcha again for the next attempt
      setTimeout(() => {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }, 100);

      if (err.code === 'auth/operation-not-allowed') {
        setError("Firebase Error (auth/operation-not-allowed): Phone Auth is still disabled on Firebase's backend. Note: It can take 5-10 minutes to activate after enabling, or you may be on the wrong Firebase project.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("Firebase Error (auth/unauthorized-domain): This app URL is not authorized. Please add this domain to Firebase Console -> Authentication -> Settings -> Authorized Domains.");
      } else if (err.code === 'auth/invalid-phone-number') {
        setError("Firebase Error (auth/invalid-phone-number): The format of the phone number is invalid. Ensure it's correct.");
      } else {
        setError(`Firebase Error: ${err.message} (${err.code || 'unknown'})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult || !user) return;

    setLoading(true);
    setError(null);
    try {
      await confirmationResult.confirm(otp);
      
      // Update profile with trial data
      const userRef = doc(db, 'users', user.uid);
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const trialStartedAt = new Date().toISOString();
      
      await updateDoc(userRef, {
        phoneNumber: phoneNumber,
        trialClaimed: true,
        trialStartedAt,
        trialEndsAt,
        trialExpiredSmsSent: false
      });

      // To avoid complete auth switch since they logged in seamlessly, OTP confirm just checks if the code is valid.
      // Call success callback
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 sm:p-8 border border-blue-100">
      <div className="flex items-start gap-4 mb-6">
        <div className="bg-blue-600 rounded-full p-3 text-white shadow-sm mt-1">
          <Phone className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Claim Your 14-Day Free Trial</h3>
          <p className="text-gray-600 text-sm mt-1 mb-4">
            Verify your phone number to unlock complete access to the AI Medical Scanner.
          </p>
        </div>
      </div>

      <div id="recaptcha-container"></div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 flex items-start gap-2 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="max-w-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Phone Number
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="max-w-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Enter Verification Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Code sent via SMS"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium text-center tracking-widest text-lg"
              required
              maxLength={6}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); setError(null); }}
              className="px-4 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Claim'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
