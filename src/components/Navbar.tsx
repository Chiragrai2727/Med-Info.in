import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Calendar, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { useAuth } from '../AuthContext';

import { Logo } from './Logo';

export const Navbar: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile, openAuthModal, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100 pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="group">
            <Logo size="md" />
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/timetable" className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-black transition-colors font-bold">
                  <Calendar className="w-5 h-5" />
                  <span className="hidden sm:inline">Timetable</span>
                </Link>
                <Link to="/scan" className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors shadow-sm">
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan</span>
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-4 border-b border-gray-50">
                      <p className="text-sm font-bold truncate">{profile?.displayName || user.email}</p>
                    </div>
                    <Link to="/dashboard" className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 font-bold flex items-center gap-2 border-b border-gray-50">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <button onClick={logout} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold flex items-center gap-2 rounded-b-2xl">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button onClick={openAuthModal} className="text-sm font-bold text-gray-600 hover:text-black transition-colors">
                Sign In
              </button>
            )}
            <LanguageToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};
