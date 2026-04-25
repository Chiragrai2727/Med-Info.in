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
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2.5rem] flex justify-around items-center h-20 border border-white/40 px-2 relative">
        <Link 
          to="/dashboard" 
          className={`flex-1 flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive('/dashboard') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="relative group">
            <LayoutDashboard className={`w-5 h-5 transition-transform duration-300 ${isActive('/dashboard') ? 'scale-110' : 'group-hover:scale-110'}`} />
            {isActive('/dashboard') && <motion.div layoutId="nav-dot" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{t('dashboard')}</span>
        </Link>
        
        <Link 
          to="/timetable" 
          className={`flex-1 flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive('/timetable') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="relative group">
            <Calendar className={`w-5 h-5 transition-transform duration-300 ${isActive('/timetable') ? 'scale-110' : 'group-hover:scale-110'}`} />
            {isActive('/timetable') && <motion.div layoutId="nav-dot" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{t('timetable')}</span>
        </Link>

        <div className="flex-shrink-0 px-2 -mt-12">
          <Link 
            to="/scan" 
            className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-[2rem] shadow-[0_12px_24px_rgba(37,99,235,0.4)] border-[6px] border-[#FDFCFB] transition-all hover:scale-105 active:scale-95 relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Camera className="w-8 h-8 relative z-10" />
          </Link>
        </div>

        <Link 
          to="/pricing" 
          className={`flex-1 flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive('/pricing') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="relative group">
            <div className={`w-5 h-5 flex items-center justify-center font-black text-sm transition-transform duration-300 ${isActive('/pricing') ? 'scale-110' : 'group-hover:scale-110'}`}>₹</div>
            {isActive('/pricing') && <motion.div layoutId="nav-dot" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Plans</span>
        </Link>

        <Link 
          to="/" 
          className={`flex-1 flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive('/') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="relative group">
            <UserIcon className={`w-5 h-5 transition-transform duration-300 ${isActive('/') ? 'scale-110' : 'group-hover:scale-110'}`} />
            {isActive('/') && <motion.div layoutId="nav-dot" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
        </Link>
      </div>
    </div>
  );
};
