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
      {/* Exact Logo Icon from Image */}
      <div className={`${iconSizes[size]} flex items-center justify-center transition-all duration-700 relative`}>
        <svg 
          viewBox="0 0 400 400" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* 8-lobed blue shape */}
          <path 
            d="M200 60C225 60 245 75 260 95C275 75 305 75 320 95C335 115 335 145 315 160C335 175 335 205 315 220C335 235 335 265 315 285C305 305 275 305 260 285C245 305 225 320 200 320C175 320 155 305 140 285C125 305 95 305 80 285C65 265 65 235 85 220C65 205 65 175 85 160C65 145 65 115 80 95C95 75 125 75 140 95C155 75 180 60 200 60Z" 
            fill="#3D5A9C" 
          />
          {/* Refined 4-Pointed Star */}
          <path 
            d="M200 135C200 180 215 200 265 200C215 200 200 220 200 265C200 220 185 200 135 200C185 200 200 180 200 135Z" 
            fill="white" 
          />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-[1.1]">
          <span className={`${textSizes[size]} font-bold tracking-tight text-[#111111]`}>
            Aethelcare
          </span>
          <span className={`${size === 'xl' ? 'text-[0.4em]' : 'text-[0.45em]'} font-bold uppercase tracking-[0.5em] text-[#8E9CBD]`}>
            INDIA
          </span>
        </div>
      )}
    </div>
  );
};
