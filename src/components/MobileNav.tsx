import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Calendar, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
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
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] rounded-[2.5rem] flex h-20 border border-white/50 px-1 relative items-stretch">
        <Link 
          to="/dashboard" 
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${isActive('/dashboard') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="relative group">
            <LayoutDashboard className={`w-5 h-5 transition-transform duration-300 ${isActive('/dashboard') ? 'scale-110' : 'group-hover:scale-110'}`} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-tight text-center leading-none">Status</span>
        </Link>
        
        <Link 
          to="/timetable" 
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${isActive('/timetable') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="relative group">
            <Calendar className={`w-5 h-5 transition-transform duration-300 ${isActive('/timetable') ? 'scale-110' : 'group-hover:scale-110'}`} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-tight text-center leading-none">Reminder</span>
        </Link>

        <div className="flex-shrink-0 flex items-center justify-center w-20 relative -top-6">
          <Link 
            to="/scan" 
            className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-[2rem] shadow-[0_12px_24px_rgba(37,99,235,0.4)] border-[6px] border-white transition-all hover:scale-105 active:scale-95 relative group overflow-hidden z-[110]"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Camera className="w-8 h-8 relative z-10" />
          </Link>
        </div>

        <Link 
          to="/pricing" 
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${isActive('/pricing') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="relative group">
            <div className={`w-5 h-5 flex items-center justify-center font-black text-sm transition-transform duration-300 ${isActive('/pricing') ? 'scale-110' : 'group-hover:scale-110'}`}>₹</div>
          </div>
          <span className="text-[8px] font-black uppercase tracking-tight text-center leading-none">Plans</span>
        </Link>

        <Link 
          to="/" 
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${isActive('/') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="relative group">
            <UserIcon className={`w-5 h-5 transition-transform duration-300 ${isActive('/') ? 'scale-110' : 'group-hover:scale-110'}`} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-tight text-center leading-none">Home</span>
        </Link>
      </div>
    </div>
  );
};
