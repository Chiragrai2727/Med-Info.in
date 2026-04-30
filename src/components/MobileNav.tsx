import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Calendar, LayoutDashboard, User as UserIcon, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';

export const MobileNav: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] safe-bottom px-4 w-full flex justify-center">
      <div className="bg-dark-bg/90 backdrop-blur-2xl px-2 py-2 rounded-full flex items-center gap-1 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <Link 
          to="/" 
          className={`relative p-3 rounded-full transition-all duration-300 ${isActive('/') ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="" className={`w-5 h-5 rounded-full object-cover border transition-all ${isActive('/') ? 'border-white' : 'border-transparent opacity-40'}`} referrerPolicy="no-referrer" />
          ) : (
            <UserIcon className="w-5 h-5" />
          )}
          {isActive('/') && <motion.div layoutId="activeNav" className="absolute inset-0 bg-primary rounded-full -z-10 shadow-[0_0_20px_rgba(29,78,216,0.4)]" />}
        </Link>
        
        <Link 
          to="/scan" 
          className={`relative p-3 rounded-full transition-all duration-300 ${isActive('/scan') ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          <Camera className="w-5 h-5" />
          {isActive('/scan') && <motion.div layoutId="activeNav" className="absolute inset-0 bg-primary rounded-full -z-10 shadow-[0_0_20px_rgba(29,78,216,0.4)]" />}
        </Link>

        <Link 
          to="/dashboard" 
          className={`relative p-3 rounded-full transition-all duration-300 ${isActive('/dashboard') ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          {isActive('/dashboard') && <motion.div layoutId="activeNav" className="absolute inset-0 bg-primary rounded-full -z-10 shadow-[0_0_20px_rgba(29,78,216,0.4)]" />}
        </Link>

        <Link 
          to="/contact" 
          className={`relative p-3 rounded-full transition-all duration-300 ${isActive('/contact') ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          <Mail className="w-5 h-5" />
          {isActive('/contact') && <motion.div layoutId="activeNav" className="absolute inset-0 bg-primary rounded-full -z-10 shadow-[0_0_20px_rgba(29,78,216,0.4)]" />}
        </Link>

        <Link 
          to="/timetable" 
          className={`relative p-3 rounded-full transition-all duration-300 ${isActive('/timetable') ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          <Calendar className="w-5 h-5" />
          {isActive('/timetable') && <motion.div layoutId="activeNav" className="absolute inset-0 bg-primary rounded-full -z-10 shadow-[0_0_20px_rgba(29,78,216,0.4)]" />}
        </Link>
      </div>
    </div>
  );
};
