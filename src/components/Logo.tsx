import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-20'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${iconSizes[size]} bg-gradient-to-br from-gray-900 to-black rounded-[24%] flex items-center justify-center shadow-2xl overflow-hidden group-hover:scale-105 transition-all duration-700 relative`}>
        {/* Subtle Glass Highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50" />
        
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-[65%] h-[65%] relative z-10"
        >
          {/* Refined Abstract Concept: Pill + Search + Cross */}
          <rect 
            x="20" 
            y="40" 
            width="60" 
            height="20" 
            rx="10" 
            fill="white" 
            fillOpacity="0.15" 
          />
          
          {/* Vertical Cross Bar (Abstract) */}
          <rect 
            x="45" 
            y="30" 
            width="10" 
            height="40" 
            rx="5" 
            fill="white" 
            fillOpacity="0.1" 
          />

          {/* Search Lens */}
          <circle 
            cx="40" 
            cy="50" 
            r="14" 
            stroke="white" 
            strokeWidth="7" 
            strokeLinecap="round"
          />
          
          {/* Lens Handle / Pill Detail */}
          <path 
            d="M50 60L65 75" 
            stroke="white" 
            strokeWidth="7" 
            strokeLinecap="round" 
          />
          
          {/* Center Dot (Focus/Info) */}
          <circle 
            cx="40" 
            cy="50" 
            r="3" 
            fill="white" 
          />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${textSizes[size]} font-black tracking-tight text-black flex items-center gap-1`}>
            MedInfo
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
          </span>
          <span className={`${size === 'xl' ? 'text-xl' : 'text-[9px]'} font-black uppercase tracking-[0.4em] text-gray-400 mt-1`}>
            India
          </span>
        </div>
      )}
    </div>
  );
};
