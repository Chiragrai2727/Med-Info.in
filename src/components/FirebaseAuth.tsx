import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FirebaseAuthProps {
  onSuccess?: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot' | 'otp' | 'reset-password' | 'reset-success';

export const FirebaseAuth: React.FC<FirebaseAuthProps> = ({ onSuccess }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, sendOTP, verifyOTP, updateUserPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (mode === 'signup' && !agreeTerms) {
      setError('Please agree to the Terms of Service');
      return;
    }
    
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else if (mode === 'forgot') {
        if (!phoneNumber) {
          setError('Please enter your mobile number');
          setLoading(false);
          return;
        }
        await sendOTP(phoneNumber);
        setMode('otp');
      } else if (mode === 'otp') {
        const fullOtp = otp.join('');
        if (fullOtp.length < 6) {
          setError('Please enter the full 6-digit code');
          setLoading(false);
          return;
        }
        await verifyOTP(phoneNumber, fullOtp);
        setMode('reset-password');
      } else if (mode === 'reset-password') {
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await updateUserPassword(newPassword);
        setMode('reset-success');
      }
      
      if ((mode === 'signin' || mode === 'signup') && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google') => {
    setLoading(true);
    setError(null);
    try {
      if (provider === 'google') await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Google Sign In failed');
      setLoading(false);
    }
  };

  const renderHeader = () => {
    switch (mode) {
      case 'signup':
        return {
          title: 'Sign Up',
          subtitle: 'Join the community for safer medication management.'
        };
      case 'forgot':
        return {
          title: 'Forgot Password',
          subtitle: 'Enter your registered mobile number to receive an OTP.'
        };
      case 'otp':
        return {
          title: 'Enter OTP',
          subtitle: `We have sent a verification code to your mobile number ending in ${phoneNumber.slice(-4) || '****'}.`
        };
      case 'reset-password':
        return {
          title: 'Reset Password',
          subtitle: 'Choose a strong password to secure your account.'
        };
      case 'reset-success':
        return {
          title: 'Success!',
          subtitle: 'Your password has been updated. You can now log in.'
        };
      default:
        return {
          title: 'Sign In',
          subtitle: 'Welcome back to your health companion.'
        };
    }
  };

  const header = renderHeader();

  return (
    <div className="w-full max-w-sm mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-center mb-10">
            <h2 className="text-[2.5rem] font-bold text-text-primary leading-tight mb-2">
              {header.title}
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed px-4 opacity-80">
              {header.subtitle}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 mb-6 text-xs text-red-600 bg-red-50 rounded-2xl border border-red-100 font-bold uppercase tracking-tight"
            >
              {error}
            </motion.div>
          )}

          {mode === 'reset-success' ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <button
                onClick={() => setMode('signin')}
                className="text-primary font-bold text-sm tracking-tight"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              {(mode === 'signin' || mode === 'signup') && (
                <div className="mb-8">
                  <button
                    onClick={() => handleSocialSignIn('google')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-border rounded-2xl font-bold text-text-primary text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>
              )}

              {(mode === 'signin' || mode === 'signup') && (
                <div className="relative flex items-center justify-center mb-8">
                  <div className="absolute w-full border-t border-border/50"></div>
                  <span className="relative bg-white px-4 text-text-secondary text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Or email</span>
                </div>
              )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-4 bg-surface/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-primary font-medium transition-all placeholder:text-text-secondary/50"
                  placeholder="Full Name"
                />
              </div>
            )}

            {(mode === 'signin' || mode === 'signup') && (
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-surface/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-primary font-medium transition-all placeholder:text-text-secondary/50"
                  placeholder="Email Address"
                />
              </div>
            )}

            {mode === 'forgot' && (
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-6 py-4 bg-surface/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-primary font-medium transition-all placeholder:text-text-secondary/50"
                  placeholder="Mobile Number"
                />
              </div>
            )}

            {mode === 'otp' && (
              <div className="flex justify-between gap-2 py-4">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-border bg-surface/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                ))}
              </div>
            )}

            {mode === 'reset-password' && (
              <>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-surface/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-primary font-medium transition-all placeholder:text-text-secondary/50"
                    placeholder="New Password"
                  />
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-surface/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-primary font-medium transition-all placeholder:text-text-secondary/50"
                    placeholder="Confirm New Password"
                  />
                </div>
              </>
            )}

            {(mode === 'signin' || mode === 'signup') && (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-surface/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-primary font-medium transition-all placeholder:text-text-secondary/50"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-text-secondary/50 hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}

                {mode === 'signin' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[10px] font-black text-text-secondary/60 hover:text-primary transition-colors uppercase tracking-widest"
                    >
                      Forgot?
                    </button>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="flex items-start gap-4 px-1 py-2">
                    <button
                      type="button"
                      onClick={() => setAgreeTerms(!agreeTerms)}
                      className={`mt-1.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all border shrink-0 ${
                        agreeTerms ? 'bg-primary border-primary' : 'bg-white border-border'
                      }`}
                    >
                      {agreeTerms && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <p className="text-[11px] text-text-secondary leading-normal font-medium">
                      I agree to the <a href="/terms" target="_blank" className="text-primary font-bold hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-primary font-bold hover:underline">Privacy Policy</a>
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (mode === 'signup' && !agreeTerms)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-base hover:bg-primary-hover disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-4 uppercase tracking-wider"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {mode === 'signin' && 'Sign In'}
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'forgot' && 'Send OTP'}
                      {mode === 'otp' && 'Verify OTP'}
                      {mode === 'reset-password' && 'Update Password'}
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 text-center">
                {mode === 'forgot' ? (
                  <button
                    onClick={() => setMode('signin')}
                    className="text-sm font-black text-primary uppercase tracking-tight"
                  >
                    Back to Sign In
                  </button>
                ) : (
                  <p className="text-sm font-medium text-text-secondary">
                    {mode === 'signin' ? "Not a member? " : "Already registered? "}
                    <button
                      onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                      className="text-primary font-black ml-1 hover:underline underline-offset-4"
                    >
                      {mode === 'signin' ? 'Create Account' : 'Sign In'}
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>

  );
};

