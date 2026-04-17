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
      {/* New Logo Icon */}
      <div className={`${iconSizes[size]} flex items-center justify-center group-hover:rotate-[30deg] transition-all duration-700 relative`}>
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Petal/Flower Shape */}
          <path 
            d="M50 0C60 0 68 8 71 18C80 16 90 22 93 31C102 34 105 44 100 52C102 61 97 71 88 75C88 85 80 93 70 95C60 100 50 100 40 95C30 93 22 85 22 75C13 71 8 61 10 52C5 44 8 34 17 31C20 22 30 16 39 18C42 8 50 0 50 0Z" 
            fill="#3B5998" 
          />
          {/* Concave 4-Pointed Star (Diamond Sparkle) */}
          <path 
            d="M50 28C50 45 61 50 80 50C61 50 50 55 50 72C50 55 39 50 20 50C39 50 50 45 50 28Z" 
            fill="white" 
          />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${textSizes[size]} font-bold tracking-tight text-black flex items-center gap-1`}>
            Aethelcare
          </span>
          <span className={`${size === 'xl' ? 'text-xl' : 'text-[10px]'} font-black uppercase tracking-[0.3em] text-slate-400 mt-1`}>
            India
          </span>
        </div>
      )}
    </div>
  );
};
