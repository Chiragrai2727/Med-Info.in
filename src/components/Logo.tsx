import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-24',
    md: 'h-48',
    lg: 'h-96',
    xl: 'h-[500px]'
  };

  return (
    <div className={`flex items-center flex-shrink-0 ${className}`}>
      {/* 
        User requested to use the provided PNG image directly.
        Expected location: /public/logo.png
      */}
      <img 
        src="/logo.png" 
        alt="Aethelcare Logo" 
        className={`${sizeClasses[size]} w-auto object-contain`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
