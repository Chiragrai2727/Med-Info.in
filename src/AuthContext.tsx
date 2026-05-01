import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  photo_url: string;
  is_premium: boolean;
  plan?: string;
  subscription_expiry?: string;
  created_at: string;
  role: 'user' | 'admin';
  phone_number?: string;
  trial_claimed?: boolean;
  trial_started_at?: string;
  trial_ends_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isOffline: boolean;
  isRecoveryMode: boolean;
  clearRecoveryMode: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendOTP: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, token: string) => Promise<void>;
  sendEmailOTP: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, token: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  updateSubscription: (tier: string, expiry: string) => Promise<void>;
  updateProfileImage: (url: string) => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['aethelcare.help@gmail.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const clearRecoveryMode = () => setIsRecoveryMode(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthChange(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setIsAuthModalOpen(true);
      } else if (event === 'SIGNED_IN' && !isRecoveryMode) {
        closeAuthModal();
      }
    });

    return () => subscription.unsubscribe();
  }, [isRecoveryMode]);

  const handleAuthChange = async (session: Session | null) => {
    if (session?.user) {
      setUser(session.user);
      const user = session.user;

      // Fetch profile from Supabase 'profiles' table (or metadata)
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No profile found, create one
        const isAdmin = ADMIN_EMAILS.includes(user.email || '');
        const newProfile = {
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.full_name || 'User',
          photo_url: user.user_metadata?.avatar_url || '',
          is_premium: isAdmin,
          role: isAdmin ? 'admin' : 'user',
          created_at: new Date().toISOString(),
          plan: isAdmin ? 'premium' : 'basic'
        };
        
        const { data: createdProfile } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
        
        if (createdProfile) {
          setProfile(mapSupabaseProfile(createdProfile));
        }
      } else if (profileData) {
        setProfile(mapSupabaseProfile(profileData));
      }
    } else {
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  };

  const mapSupabaseProfile = (data: any): UserProfile => {
    const isAdmin = ADMIN_EMAILS.includes(data.email || '');
    return {
      id: data.id,
      email: data.email || '',
      display_name: data.display_name || 'User',
      photo_url: data.photo_url || '',
      is_premium: isAdmin || data.is_premium || false,
      plan: data.plan,
      subscription_expiry: data.subscription_expiry,
      created_at: data.created_at,
      role: isAdmin ? 'admin' : 'user',
      phone_number: data.phone_number,
      trial_claimed: data.trial_claimed,
      trial_started_at: data.trial_started_at,
      trial_ends_at: data.trial_ends_at
    };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    closeAuthModal();
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { full_name: name }
      }
    });
    if (error) throw error;
    closeAuthModal();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  };

  const formatPhone = (phone: string) => {
    let formattedPhone = phone.replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }
    return formattedPhone;
  };

  const sendOTP = async (phone: string) => {
    // Note: Phone number must be in E.164 format
    const { error } = await supabase.auth.signInWithOtp({
      phone: formatPhone(phone),
    });
    if (error) throw error;
  };

  const verifyOTP = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone: formatPhone(phone),
      token,
      type: 'sms'
    });
    if (error) throw error;
  };

  const sendEmailOTP = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const verifyEmailOTP = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery'
    });
    if (error) throw error;
  };

  const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const upgradeToPremium = async () => {
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: true, plan: 'premium' })
        .eq('id', user.id);
      if (error) throw error;
    }
  };

  const updateSubscription = async (tier: string, expiry: string) => {
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ plan: tier, subscription_expiry: expiry, is_premium: true })
        .eq('id', user.id);
      if (error) throw error;
    }
  };

  const updateProfileImage = async (url: string) => {
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ photo_url: url })
        .eq('id', user.id);
      if (error) throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, isOffline, isRecoveryMode, clearRecoveryMode,
      signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword,
      sendOTP, verifyOTP, sendEmailOTP, verifyEmailOTP, updateUserPassword,
      logout, upgradeToPremium, updateSubscription, updateProfileImage,
      isAuthModalOpen, openAuthModal, closeAuthModal
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
