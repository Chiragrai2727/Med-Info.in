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
    <div className="md:hidden fixed bottom-6 left-0 right-0 z-[100] px-4 safe-bottom">
      <div className="max-w-lg mx-auto bg-white/80 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[2rem] flex justify-around items-center h-16 border border-white/20 px-2">
        <Link 
          to="/dashboard" 
          className={`flex-1 flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/dashboard') ? 'text-blue-600' : 'text-gray-400 hover:text-gray-500'}`}
        >
          <LayoutDashboard className={`w-5 h-5 transition-transform duration-300 ${isActive('/dashboard') ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-wider">{t('dashboard')}</span>
        </Link>
        
        <Link 
          to="/timetable" 
          className={`flex-1 flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/timetable') ? 'text-blue-600' : 'text-gray-400 hover:text-gray-500'}`}
        >
          <Calendar className={`w-5 h-5 transition-transform duration-300 ${isActive('/timetable') ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-wider">{t('timetable')}</span>
        </Link>

        <div className="flex-shrink-0 -mt-10 px-2">
          <Link 
            to="/scan" 
            className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl shadow-[0_8px_20px_rgba(37,99,235,0.3)] border-4 border-[#F8FAFC] transition-all hover:scale-105 active:scale-90"
          >
            <Camera className="w-7 h-7" />
          </Link>
        </div>

        <Link 
          to="/pricing" 
          className={`flex-1 flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/pricing') ? 'text-blue-600' : 'text-gray-400 hover:text-gray-500'}`}
        >
          <div className={`w-5 h-5 flex items-center justify-center font-black text-sm transition-transform duration-300 ${isActive('/pricing') ? 'scale-125' : ''}`}>₱</div>
          <span className="text-[10px] font-black uppercase tracking-wider">Plans</span>
        </Link>

        <Link 
          to="/" 
          className={`flex-1 flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/') ? 'text-blue-600' : 'text-gray-400 hover:text-gray-500'}`}
        >
          <UserIcon className={`w-5 h-5 transition-transform duration-300 ${isActive('/') ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-wider">Home</span>
        </Link>
      </div>
    </div>
  );
};
