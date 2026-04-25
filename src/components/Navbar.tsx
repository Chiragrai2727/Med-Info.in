import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Calendar, User as UserIcon, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { useAuth } from '../AuthContext';

import { Logo } from './Logo';

export const Navbar: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile, openAuthModal, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] glass border-b border-blue-100/20 pt-safe transition-all duration-300">
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center h-16 sm:h-20 2xl:h-24">
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
          
          <div className="flex items-center gap-2 sm:gap-4 2xl:gap-8">
            <Link to="/about" className="hidden lg:block px-3 py-2 text-sm 2xl:text-xl font-bold text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] transition-colors">
              About
            </Link>
            <Link to="/pricing" className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm 2xl:text-xl font-bold text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors whitespace-nowrap">
              <span className="hidden xs:inline">Plans</span>
              <span className="xs:hidden">₱</span>
            </Link>
            {user ? (
              <>
                <Link to="/timetable" className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-2 text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] transition-colors font-bold text-xs sm:text-sm 2xl:text-xl">
                  <Calendar className="w-4 h-4 sm:w-5 h-5 2xl:w-8 h-8" />
                  <span>{t('timetable')}</span>
                </Link>
                <Link to="/scan" className="hidden sm:flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 text-xs sm:text-sm 2xl:text-xl">
                  <Camera className="w-3.5 h-3.5 sm:w-4 h-4 2xl:w-7 h-7" />
                  <span>{t('scan')}</span>
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-7 h-7 sm:w-8 h-8 2xl:w-12 h-12 rounded-full border border-[var(--color-ink)]/20" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 h-8 2xl:w-12 h-12 bg-[var(--color-ink)]/10 rounded-full flex items-center justify-center">
                        <UserIcon className="w-3.5 h-3.5 sm:w-4 h-4 2xl:w-6 h-6 text-[var(--color-ink)]/50" />
                      </div>
                    )}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 2xl:w-64 bg-[var(--color-bg)] rounded-2xl shadow-xl border border-[var(--color-ink)]/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-4 border-b border-[var(--color-ink)]/5">
                      <p className="text-sm 2xl:text-lg font-bold truncate">{profile?.displayName || user.email}</p>
                    </div>
                    <Link to="/dashboard" className="w-full text-left px-4 py-3 text-sm 2xl:text-lg text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5 font-bold flex items-center gap-2 border-b border-[var(--color-ink)]/5">
                      <LayoutDashboard className="w-4 h-4 2xl:w-6 h-6" />
                      {t('dashboard')}
                    </Link>
                    {profile?.role === 'admin' && (
                      <Link to="/admin" className="w-full text-left px-4 py-3 text-sm 2xl:text-lg text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 font-bold flex items-center gap-2 border-b border-[var(--color-ink)]/5">
                        <ShieldCheck className="w-4 h-4 2xl:w-6 h-6" /> {t('adminPanel')}
                      </Link>
                    )}
                    <button onClick={logout} className="w-full text-left px-4 py-3 text-sm 2xl:text-lg text-red-600 hover:bg-red-50 font-bold flex items-center gap-2 rounded-b-2xl">
                      <LogOut className="w-4 h-4 2xl:w-6 h-6" /> {t('signOut')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button onClick={openAuthModal} className="text-sm 2xl:text-xl font-bold text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] transition-colors px-2 py-1">
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
