import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

// Define the profile schema to match our existing UI expectations
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isPremium: boolean;
  subscriptionTier?: string;
  subscriptionExpiry?: string;
  createdAt: string;
  role: 'user' | 'admin';
  phoneNumber?: string;
  trialClaimed?: boolean;
  trialStartedAt?: string;
  trialEndsAt?: string;
}

interface AuthContextType {
  user: any; // Using any for compatibility with existing components
  profile: UserProfile | null;
  loading: boolean;
  isOffline: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string, rememberMe?: boolean) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  updateSubscription: (tier: string, expiry: string) => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['aethelcare.help@gmail.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

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

  const fetchProfileData = async (supabaseUser: User) => {
    try {
      // Fetch from Supabase 'users' table
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // User not found in 'users' table, create a default entry
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(now.getDate() + 14);

        const newUserData = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          plan: 'premium',
          trial_start: now.toISOString(),
          trial_end: trialEnd.toISOString()
        };

        const { data: created, error: insertError } = await supabase
          .from('users')
          .upsert(newUserData)
          .select()
          .single();
        
        if (!insertError) {
          data = created;
        }
      }

      if (data) {
        const isAdmin = ADMIN_EMAILS.includes(supabaseUser.email || '');
        const mappedProfile: UserProfile = {
          uid: supabaseUser.id,
          email: supabaseUser.email || '',
          displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          photoURL: supabaseUser.user_metadata?.avatar_url || '',
          isPremium: isAdmin || data.plan === 'premium',
          subscriptionTier: data.plan,
          subscriptionExpiry: data.trial_end,
          createdAt: data.created_at || new Date().toISOString(),
          role: isAdmin ? 'admin' : 'user',
          trialClaimed: !!data.trial_start,
          trialStartedAt: data.trial_start,
          trialEndsAt: data.trial_end
        };
        setProfile(mappedProfile);
      }
    } catch (err) {
      console.error('Error fetching Supabase user profile:', err);
    }
  };

  useEffect(() => {
    // 1. Initial Session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Normalize for components expecting Firebase structure (uid key)
        const normalized = { ...session.user, uid: session.user.id };
        setUser(normalized);
        fetchProfileData(session.user);
      }
      setLoading(false);
    });

    // 2. Continuous Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const normalized = { ...session.user, uid: session.user.id };
        setUser(normalized);
        await fetchProfileData(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password: pass,
      options: { data: { full_name: name } }
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const upgradeToPremium = async () => {
    if (user) {
      await supabase.from('users').update({ plan: 'premium' }).eq('id', user.id);
      if (profile) setProfile({ ...profile, isPremium: true, subscriptionTier: 'premium' });
    }
  };

  const updateSubscription = async (tier: string, expiry: string) => {
    if (user) {
      await supabase.from('users').update({ plan: tier, trial_end: expiry }).eq('id', user.id);
      if (profile) setProfile({ ...profile, subscriptionTier: tier, subscriptionExpiry: expiry, isPremium: true });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, isOffline,
      signInWithGoogle, signInWithEmail, signUpWithEmail, 
      logout, upgradeToPremium, updateSubscription,
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
