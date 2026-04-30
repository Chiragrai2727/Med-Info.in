import React from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Clock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export const TrialBanner: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  if (!user || !profile || profile.is_premium || profile.role === 'admin') {
    return null; // hide for premium users, admins, or non-logged in users
  }

  const hasClaimedTrial = profile.trial_claimed === true;
  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const trialActive = trialEndsAt ? trialEndsAt > new Date() : false;

  let trialDaysRemaining = 0;
  if (trialEndsAt && trialActive) {
    const diffTime = Math.abs(trialEndsAt.getTime() - new Date().getTime());
    trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // If on dashboard, we don't necessarily need to be as aggressive since the UI is there,
  // but a persistent bar across the app is nice. Let's keep it everywhere.

  if (!hasClaimedTrial) {
    return (
      <div 
        onClick={() => navigate('/dashboard')}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm font-medium z-40 relative"
      >
        <Zap className="w-4 h-4 text-yellow-300" />
        <span>You haven't claimed your 14-Day Free Trial yet!</span>
        <span className="font-bold underline">Claim Now</span>
      </div>
    );
  }

  if (trialActive) {
    return (
      <div 
        onClick={() => navigate('/dashboard')}
        className="bg-indigo-50 border-b border-indigo-100 text-indigo-900 px-4 py-2 cursor-pointer hover:bg-indigo-100 transition-colors flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm font-medium z-40 relative"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>Your Free Trial ends in <strong className="text-indigo-700">{trialDaysRemaining} days</strong>.</span>
        </div>
        <span className="bg-indigo-600 text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-sm">
          Upgrade to Premium
        </span>
      </div>
    );
  }

  // Trial expired
  return (
    <div 
      onClick={() => navigate('/dashboard')}
      className="bg-red-50 border-b border-red-100 text-red-900 px-4 py-2 cursor-pointer hover:bg-red-100 transition-colors flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm font-medium z-40 relative"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <span>Your Trial has expired!</span>
      </div>
      <span className="bg-red-600 text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-sm">
        Upgrade Now to regain access
      </span>
    </div>
  );
};
