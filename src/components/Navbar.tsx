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
                <div className="relative group flex-shrink-0 ml-1 sm:ml-2">
                  <button className="flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-full hover:bg-black/5 transition-all flex-shrink-0 aspect-square overflow-hidden border border-border/10">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-full h-full aspect-square rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full aspect-square bg-primary/5 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-5 h-5 text-primary flex-shrink-0" />
                      </div>
                    )}
                  </button>
                  <div className="absolute right-0 mt-3 w-64 bg-surface rounded-[1.25rem] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.2)] border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right group-hover:translate-y-0 translate-y-3 overflow-hidden">
                    <div className="p-5 border-b border-border bg-bg/50">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary/60 mb-1">Account</p>
                      <p className="text-base font-black truncate text-text-primary tracking-tight">{profile?.displayName || user.email}</p>
                    </div>
                    <div className="p-2">
                      <Link to="/dashboard" className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-bg hover:text-primary rounded-xl font-bold flex items-center gap-3 transition-all group/item">
                        <LayoutDashboard className="w-4 h-4 text-primary/60 group-hover/item:text-primary transition-colors" />
                        {t('dashboard')}
                      </Link>
                      <Link to="/contact" className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-bg hover:text-primary rounded-xl font-bold flex items-center gap-3 transition-all group/item">
                        <Mail className="w-4 h-4 text-primary/60 group-hover/item:text-primary transition-colors" />
                        Contact Us
                      </Link>
                      {profile?.role === 'admin' && (
                        <Link to="/admin" className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-bg hover:text-primary rounded-xl font-bold flex items-center gap-3 transition-all group/item">
                          <ShieldCheck className="w-4 h-4 text-primary/60 group-hover/item:text-primary transition-colors" /> 
                          {t('adminPanel')}
                        </Link>
                      )}
                      <div className="h-px bg-border my-2 mx-2" />
                      <button onClick={logout} className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger/5 rounded-xl font-bold flex items-center gap-3 transition-colors">
                        <LogOut className="w-4 h-4" /> 
                        {t('signOut')}
                      </button>
                    </div>
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
