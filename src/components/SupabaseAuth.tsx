import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface SupabaseAuthProps {
  onSuccess?: () => void;
}

export const SupabaseAuth: React.FC<SupabaseAuthProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        shouldCreateUser: true
      }
    });

    if (error) {
      if (error.message.includes("Invalid path") || error.message.includes("URL")) {
        setError("Configuration Error: The VITE_SUPABASE_URL provided is invalid. Make sure it is your exactly API URL (e.g. https://xyz.supabase.co) and not your Dashboard URL. Also make sure to set it in AI Studio settings, not just Netlify!");
      } else {
        setError(error.message);
      }
    } else {
      setStep('otp');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      if (onSuccess) {
        onSuccess();
      } else {
        // Alternatively, redirect to homepage
        window.location.href = '/';
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Welcome
      </h2>
      <p className="text-gray-500 text-sm text-center mb-6">
        Sign in or create a new account to continue.
      </p>
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-xl">
          {error}
        </div>
      )}

      {step === 'email' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Sending Code...' : 'Send Login/Signup Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-sm text-gray-600 text-center mb-4">
            We sent a 6-digit code to <strong>{email}</strong>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enter Code</label>
            <input
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 text-center tracking-widest text-lg bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="000000"
              maxLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify & Claim Trial'}
          </button>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="w-full py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
};
