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
        // Only set this if you want to restrict to specific origins, 
        // otherwise let Supabase handle redirect
        shouldCreateUser: true
      }
    });

    if (error) {
      setError(error.message);
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
      // Setup Trial logic on successful OTP verification (Part 2)
      try {
        // Check if user row already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', authData.user.id)
          .single();

        if (!existingUser) {
          // Calculate trial dates
          const now = new Date();
          const trialEnd = new Date(now);
          trialEnd.setDate(now.getDate() + 14);

          // Insert new user row with premium trial
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              plan: 'premium',
              trial_start: now.toISOString(),
              trial_end: trialEnd.toISOString()
            });

          if (insertError) {
            console.error('Failed to create user row:', insertError);
          }
        }
        
        if (onSuccess) {
          onSuccess();
        } else {
          // Alternatively, redirect to homepage
          window.location.href = '/';
        }
      } catch (err) {
        console.error('Setup error:', err);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Claim Free 14-Day Trial
      </h2>
      
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
            {loading ? 'Sending Code...' : 'Send Login Code'}
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
