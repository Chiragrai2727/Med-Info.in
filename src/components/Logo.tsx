import React from 'react';
import { useTheme } from '../ThemeContext';
import logoLight from '../assets/logo-final-v100.png';
import logoDark from '../assets/logo-white-final-v100.png';

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
  
  // Use imported assets which Vite will hash and handle correctly
  const logoSrc = theme === 'dark' ? logoDark : logoLight;

  return (
    <div className={`flex items-center flex-shrink-0 ${className}`}>
      <img 
        src={logoSrc} 
        alt="Aethelcare India" 
        className={`${sizeClasses[size].split(' ')[0]} w-auto max-w-full object-contain`}
        style={{ display: 'block', minWidth: '40px' }}
        fetchPriority="high"
      />
    </div>
  );
};
