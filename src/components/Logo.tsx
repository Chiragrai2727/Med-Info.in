import React from 'react';
import { useTheme } from '../ThemeContext';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 text-xl',
    md: 'h-10 text-2xl',
    lg: 'h-16 text-4xl',
    xl: 'h-24 text-6xl'
  };

  const { theme } = useTheme();

  return (
    <div className={`flex items-center flex-shrink-0 ${className}`}>
      <img 
        src={theme === 'dark' ? '/logo-white.png?v=4' : '/logo.png?v=4'} 
        alt="Aethelcare Logo" 
        className={`${sizeClasses[size].split(' ')[0]} w-auto max-w-full object-contain`}
        fetchPriority="high"
      />
    </div>
  );
};
