import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Calendar, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';

export const MobileNav: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-safe pt-2">
      <div className="bg-white/70 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.05)] rounded-2xl flex justify-around items-center h-16 border border-white/40">
        <Link 
          to="/dashboard" 
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/dashboard') ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider hidden xs:block">{t('dashboard')}</span>
        </Link>
        
        <Link 
          to="/timetable" 
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/timetable') ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider hidden xs:block">{t('timetable')}</span>
        </Link>

        <Link 
          to="/scan" 
          className="relative flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/30 -mt-8 border-4 border-[var(--color-bg)] transition-transform active:scale-90"
        >
          <Camera className="w-7 h-7" />
        </Link>

        <Link 
          to="/pricing" 
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/pricing') ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <div className="w-5 h-5 flex items-center justify-center font-black text-sm">₱</div>
          <span className="text-[10px] font-bold uppercase tracking-wider hidden xs:block">Plans</span>
        </Link>

        <Link 
          to="/" 
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/') ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider hidden xs:block">Home</span>
        </Link>
      </div>
    </div>
  );
};
