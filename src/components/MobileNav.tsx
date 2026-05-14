import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Calendar, LayoutDashboard, User as UserIcon, Mail, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';

export const MobileNav: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] safe-bottom w-full">
      <div className="bg-surface/90 backdrop-blur-xl border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex items-center justify-around px-2 py-2 pb-safe">
        <Link 
          to="/" 
          className="flex flex-col items-center gap-1 p-2 flex-1"
        >
          <div className="relative">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className={`w-6 h-6 aspect-square rounded-full object-cover border transition-all ${isActive('/') ? 'border-primary' : 'border-transparent opacity-60'}`} referrerPolicy="no-referrer" />
            ) : (
              <div className={`w-6 h-6 aspect-square rounded-full flex items-center justify-center ${isActive('/') ? 'text-primary bg-primary/10' : 'text-text-secondary'}`}>
                <UserIcon className="w-5 h-5" />
              </div>
            )}
            {isActive('/') && <motion.div layoutId="activeMobileNav" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
          </div>
          <span className={`text-[10px] font-medium ${isActive('/') ? 'text-primary' : 'text-text-secondary'}`}>
            {t('home')}
          </span>
        </Link>
        
        <Link 
          to="/scan" 
          className="flex flex-col items-center gap-1 p-2 flex-1 relative"
        >
          <div className={`w-12 h-12 -mt-6 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${isActive('/scan') ? 'bg-primary shadow-primary/30' : 'bg-primary/90'}`}>
            <Camera className="w-5 h-5" />
          </div>
          <span className={`text-[10px] font-medium pt-0.5 ${isActive('/scan') ? 'text-primary' : 'text-text-secondary'}`}>
            {t('scan')}
          </span>
          {isActive('/scan') && <motion.div layoutId="activeMobileNav" className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full hidden" />}
        </Link>

        <Link 
          to="/dashboard" 
          className="flex flex-col items-center gap-1 p-2 flex-1 relative"
        >
          <div className={`transition-all ${isActive('/dashboard') ? 'text-primary' : 'text-text-secondary'}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className={`text-[10px] font-medium ${isActive('/dashboard') ? 'text-primary' : 'text-text-secondary'}`}>
            {t('dashboard')}
          </span>
          {isActive('/dashboard') && <motion.div layoutId="activeMobileNav" className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
        </Link>

        <button 
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1 p-2 flex-1 text-text-secondary"
        >
          <div>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </div>
          <span className="text-[10px] font-medium">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>

        <Link 
          to="/timetable" 
          className="flex flex-col items-center gap-1 p-2 flex-1 relative"
        >
          <div className={`transition-all ${isActive('/timetable') ? 'text-primary' : 'text-text-secondary'}`}>
            <Calendar className="w-5 h-5" />
          </div>
          <span className={`text-[10px] font-medium ${isActive('/timetable') ? 'text-primary' : 'text-text-secondary'}`}>
            {t('timetable')}
          </span>
          {isActive('/timetable') && <motion.div layoutId="activeMobileNav" className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
        </Link>
      </div>
    </div>
  );
};
