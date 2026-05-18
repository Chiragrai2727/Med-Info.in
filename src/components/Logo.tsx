import React from 'react';
import { useTheme } from '../ThemeContext';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const { theme } = useTheme();
  
  const logoSrc = theme === 'dark' 
    ? '/brand-logo-white.png' 
    : '/brand-logo.png';

  const heights = {
    sm: '32px',
    md: '40px',
    lg: '64px',
    xl: '96px'
  };

  return (
    <div 
      className={`flex items-center flex-shrink-0 ${className}`} 
      style={{ minWidth: '120px', minHeight: heights[size] }}
    >
      <img 
        src={logoSrc} 
        alt="Aethelcare India"
        className="w-auto h-full object-contain"
        style={{ 
          height: heights[size],
          display: 'block',
          aspectRatio: 'auto'
        }}
        fetchPriority="high"
        loading="eager"
        decoding="async"
      />
    </div>
  );
};
