import React from 'react';
import { useTheme } from '../ThemeContext';

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
  
  // Use absolute public paths. We'll rely on the filename the user wants.
  const logoSrc = theme === 'dark' 
    ? '/logo-white-final-v100.png' 
    : '/logo-final-v100.png';

  const heights = {
    sm: '32px',
    md: '40px',
    lg: '64px',
    xl: '96px'
  };

  return (
    <div className={`flex items-center flex-shrink-0 ${className}`} style={{ minWidth: '120px' }}>
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
