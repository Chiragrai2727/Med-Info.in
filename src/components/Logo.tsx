import React from 'react';
import { useTheme } from '../ThemeContext';
import logoLight from '../assets/aethelcare-logo-final-v1.png';
import logoDark from '../assets/aethelcare-logo-white-final-v1.png';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
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
        src={theme === 'dark' ? logoDark : logoLight} 
        alt="Aethelcare Logo" 
        className={`${sizeClasses[size].split(' ')[0]} w-auto max-w-full object-contain`}
        style={{ display: 'block' }}
        fetchPriority="high"
      />
    </div>
  );
};
