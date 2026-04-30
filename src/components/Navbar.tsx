import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Calendar, User as UserIcon, LogOut, LayoutDashboard, ShieldCheck, Mail } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { useAuth } from '../AuthContext';

import { Logo } from './Logo';

export const Navbar: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile, openAuthModal, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-[20px] bg-surface/70 border-b border-border/40 pt-safe transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link to="/" className="group flex-shrink-0">
            <div className="sm:hidden">
              <Logo size="sm" showText={false} />
            </div>
            <div className="hidden sm:block 2xl:hidden">
              <Logo size="md" />
            </div>
            <div className="hidden 2xl:block">
              <Logo size="lg" />
            </div>
          </Link>
          
          <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
            <Link to="/about" className="hidden lg:block px-3 py-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors flex-shrink-0">
              About
            </Link>
            <Link to="/contact" className="hidden lg:block px-3 py-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors flex-shrink-0">
              Contact
            </Link>
            <Link to="/pricing" className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-primary bg-primary/5 rounded-full hover:bg-primary/10 transition-colors whitespace-nowrap flex-shrink-0">
              <span className="hidden xs:inline">Plans</span>
              <span className="xs:hidden">₹</span>
            </Link>
            {user ? (
              <>
                <Link to="/timetable" className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-2 text-text-secondary hover:text-text-primary transition-colors font-bold text-xs sm:text-sm flex-shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 h-5 flex-shrink-0" />
                  <span>{t('timetable')}</span>
                </Link>
                <Link to="/scan" className="hidden sm:flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-primary text-white rounded-full font-bold hover:bg-primary-hover transition-all shadow-lg hover:shadow-primary/30 text-xs sm:text-sm flex-shrink-0">
                  <Camera className="w-3.5 h-3.5 sm:w-4 h-4 flex-shrink-0" />
                  <span>{t('scan')}</span>
                </Link>
                <div className="relative group flex-shrink-0">
                  <button className="flex items-center justify-center w-8 h-8 sm:w-10 h-10 rounded-full hover:bg-black/5 transition-all flex-shrink-0">
                    {profile?.photo_url ? (
                      <img src={profile.photo_url} alt="Profile" className="w-full h-full aspect-square rounded-full border-2 border-surface shadow-sm object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full aspect-square bg-primary/5 rounded-full flex items-center justify-center border-2 border-surface shadow-sm flex-shrink-0">
                        <UserIcon className="w-4 h-4 sm:w-5 h-5 text-primary flex-shrink-0" />
                      </div>
                    )}
                  </button>
                  <div className="absolute right-0 mt-2 w-56 backdrop-blur-[32px] bg-surface/80 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-border/40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right group-hover:translate-y-0 translate-y-2">
                    <div className="p-5 border-b border-black/5">
                      <p className="text-xs font-black uppercase tracking-widest text-text-secondary/50 mb-1">Account</p>
                      <p className="text-sm font-black truncate text-text-primary">{profile?.display_name || user.email}</p>
                    </div>
                    <Link to="/dashboard" className="w-full text-left px-5 py-3 text-sm text-text-secondary hover:bg-primary/5 font-bold flex items-center gap-3 transition-colors">
                      <LayoutDashboard className="w-4 h-4 text-primary" />
                      {t('dashboard')}
                    </Link>
                    <Link to="/contact" className="w-full text-left px-5 py-3 text-sm text-text-secondary hover:bg-primary/5 font-bold flex items-center gap-3 transition-colors">
                      <Mail className="w-4 h-4 text-primary" />
                      Contact Us
                    </Link>
                    {profile?.role === 'admin' && (
                      <Link to="/admin" className="w-full text-left px-5 py-3 text-sm text-primary hover:bg-primary/5 font-bold flex items-center gap-3 border-b border-black/5">
                        <ShieldCheck className="w-4 h-4" /> {t('adminPanel')}
                      </Link>
                    )}
                    <button onClick={logout} className="w-full text-left px-5 py-3 text-sm text-danger hover:bg-danger/5 font-bold flex items-center gap-3 rounded-b-2xl">
                      <LogOut className="w-4 h-4" /> {t('signOut')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button onClick={openAuthModal} className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors px-2 py-1">
                {t('signIn')}
              </button>
            )}
            <LanguageToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};
