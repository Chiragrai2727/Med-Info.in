import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12', // Increased from h-10 to make it more prominent
    lg: 'h-24',
    xl: 'h-32'
  };

  return (
    <div className={`flex items-center flex-shrink-0 ${className}`}>
      <img 
        src="/logo.png" 
        alt="Aethelcare Logo" 
        className={`${sizeClasses[size]} w-auto max-w-full object-contain`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
