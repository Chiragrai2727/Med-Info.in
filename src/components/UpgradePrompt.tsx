import React from 'react';
import { motion } from 'motion/react';
import { PLANS } from '../config/plans';
import { ArrowRight, ShieldAlert, Sparkles, Lock } from 'lucide-react';
import { PricingModal } from './PricingModal';

interface UpgradePromptProps {
  reason: 'limit_reached' | 'rate_limited' | 'premium_feature';
  featureName?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ reason, featureName }) => {
  const [showPricing, setShowPricing] = React.useState(false);
  const familyPlan = PLANS.family;

  let title = '';
  let subtitle = '';
  let Icon = Sparkles;
  let colorClass = 'text-indigo-600';

  switch (reason) {
    case 'limit_reached':
      title = "You've used all 5 free scans.";
      subtitle = "Upgrade to keep understanding your health and digitizing prescriptions.";
      break;
    case 'rate_limited':
      title = "Whoa, slow down!";
      subtitle = "You are scanning very quickly. Please wait a few minutes and try again to protect our servers.";
      Icon = ShieldAlert;
      colorClass = 'text-amber-500';
      break;
    case 'premium_feature':
      title = "Unlock Premium Features";
      subtitle = `${featureName ? featureName : 'This'} is a Premium feature. Upgrade to unlock it securely.`;
      Icon = Lock;
      break;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 mb-4 text-indigo-600`}>
              <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto md:mx-0">{subtitle}</p>
            
            <button
              onClick={() => setShowPricing(true)}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              See all plans <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {reason !== 'rate_limited' && (
            <div className="w-full md:w-80 bg-gray-50 rounded-xl p-6 border border-gray-200 shrink-0">
              <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Most Popular</div>
              <h4 className="font-bold text-gray-900 text-lg">{familyPlan.name} Plan</h4>
              <div className="text-2xl font-bold text-gray-900 my-2">{familyPlan.price_display}<span className="text-sm text-gray-500 font-normal">/mo</span></div>
              
              <ul className="space-y-2 mt-4 mb-6">
                {familyPlan.features.slice(0, 3).map((f: string, i: number) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="leading-tight">{f}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => setShowPricing(true)}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
              >
                {familyPlan.cta}
              </button>
            </div>
          )}
        </div>
      </motion.div>
      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
    </>
  );
};
