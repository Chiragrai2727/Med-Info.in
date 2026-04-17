import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 text-xl',
    md: 'h-10 text-2xl',
    lg: 'h-16 text-4xl',
    xl: 'h-24 text-6xl'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  if (imageError) {
    return (
      <div className={`flex items-center gap-2 font-black tracking-tighter text-black ${className}`}>
        <div className={`bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg ${size === 'sm' ? 'p-1' : 'p-2'}`}>
          <ShieldCheck className={iconSizes[size]} />
        </div>
        {showText && <span className={sizeClasses[size].split(' ')[1]}>Aethelcare</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center flex-shrink-0 ${className}`}>
      <img 
        src="/logo.png" 
        alt="Aethelcare Logo" 
        className={`${sizeClasses[size].split(' ')[0]} w-auto max-w-full object-contain`}
        onError={() => setImageError(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
