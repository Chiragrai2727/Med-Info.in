import React from 'react';
import { motion } from 'motion/react';
import { PLANS } from '../config/plans';

interface ScanProgressBarProps {
  used: number;
  total: number;
  tier: 'free' | 'premium';
  onUpgradeClick: () => void;
}

export const ScanProgressBar: React.FC<ScanProgressBarProps> = ({ used, total, tier, onUpgradeClick }) => {
  const percentage = Math.min(100, Math.max(0, (used / total) * 100));
  
  let colorClass = 'bg-indigo-500';
  let barBgClass = 'bg-indigo-100';
  
  if (tier === 'free') {
    if (used === total - 1) {
      colorClass = 'bg-amber-500';
      barBgClass = 'bg-amber-100';
    } else if (used >= total) {
      colorClass = 'bg-red-500';
      barBgClass = 'bg-red-100';
    }
  }

  return (
    <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex-1 max-w-md">
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-xs font-semibold text-gray-700">
              {tier === 'free' 
                ? `${used} of ${total} free scans used` 
                : `${used} of ${total} scans used this month`
              }
            </span>
          </div>
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${barBgClass}`}>
            <motion.div 
              className={`h-full rounded-full ${colorClass}`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
        
        {tier === 'free' && used >= total - 2 && (
          <button 
            onClick={onUpgradeClick}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 whitespace-nowrap self-start md:self-auto"
          >
            Upgrade for 100 scans/mo →
          </button>
        )}
      </div>
    </div>
  );
};
