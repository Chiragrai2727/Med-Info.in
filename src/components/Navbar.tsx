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
    <nav className="fixed top-0 left-0 right-0 z-[100] glass border-b border-blue-100/20 pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="group">
            <Logo size="md" />
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/about" className="hidden md:block px-3 py-2 text-sm font-bold text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] transition-colors">
              About
            </Link>
            {user ? (
              <>
                <Link to="/timetable" className="flex items-center gap-2 px-3 py-2 text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] transition-colors font-bold">
                  <Calendar className="w-5 h-5" />
                  <span className="hidden sm:inline">{t('timetable')}</span>
                </Link>
                <Link to="/scan" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30">
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('scan')}</span>
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-[var(--color-ink)]/20" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 bg-[var(--color-ink)]/10 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-[var(--color-ink)]/50" />
                      </div>
                    )}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--color-bg)] rounded-2xl shadow-xl border border-[var(--color-ink)]/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-4 border-b border-[var(--color-ink)]/5">
                      <p className="text-sm font-bold truncate">{profile?.displayName || user.email}</p>
                    </div>
                    <Link to="/dashboard" className="w-full text-left px-4 py-3 text-sm text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5 font-bold flex items-center gap-2 border-b border-[var(--color-ink)]/5">
                      <div className="w-4 h-4">
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      {t('dashboard')}
                    </Link>
                    {profile?.role === 'admin' && (
                      <Link to="/admin" className="w-full text-left px-4 py-3 text-sm text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 font-bold flex items-center gap-2 border-b border-[var(--color-ink)]/5">
                        <ShieldCheck className="w-4 h-4" /> {t('adminPanel')}
                      </Link>
                    )}
                    <button onClick={logout} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold flex items-center gap-2 rounded-b-2xl">
                      <LogOut className="w-4 h-4" /> {t('signOut')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button onClick={openAuthModal} className="text-sm font-bold text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] transition-colors">
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
