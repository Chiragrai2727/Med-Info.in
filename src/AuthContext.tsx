/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, getProfile, saveProfile } from './supabase';

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
  plan?: 'basic' | 'premium';
}

interface AuthContextType {
  user: {
    uid: string;
    id: string;
    email: string;
    displayName: string;
    photoURL: string;
  } | null;
  profile: UserProfile | null;
  loading: boolean;
  isOffline: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  updateSubscription: (tier: string, expiry: string) => Promise<void>;
  updateProfileImage: (url: string) => Promise<void>;
  updateProfileData: (data: any) => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['aethelcare.help@gmail.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{
    uid: string;
    id: string;
    email: string;
    displayName: string;
    photoURL: string;
  } | null>(null);
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

  useEffect(() => {
    // FAILSAFE TIMEOUT 
    const failsafe = setTimeout(() => {
      console.log("FAILSAFE TRIGGERED - Setting loading to false");
      setLoading(false);
    }, 5000);

    console.log("AuthContext mount: isSupabaseConfigured=", isSupabaseConfigured());
    if (isSupabaseConfigured()) {
      // Direct session restoration check on mount
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log("AuthContext getSession result:", session?.user?.email);
        if (session?.user) {
          const sUser = session.user;
          const mappedUser = {
            uid: sUser.id,
            id: sUser.id,
            email: sUser.email || '',
            displayName: sUser.user_metadata?.displayName || sUser.user_metadata?.full_name || 'User',
            photoURL: sUser.user_metadata?.avatar_url || '',
          };
          setUser(mappedUser);
          
          getProfile(sUser.id).then((prof) => {
            console.log("AuthContext getProfile result:", prof?.email);
            const isAdmin = ADMIN_EMAILS.includes(sUser.email || '');
            if (!prof) {
              const newProf = {
                uid: sUser.id,
                email: sUser.email || '',
                displayName: mappedUser.displayName,
                photoURL: mappedUser.photoURL,
                isPremium: isAdmin,
                createdAt: new Date().toISOString(),
                role: isAdmin ? 'admin' as const : 'user' as const
              };
              saveProfile(sUser.id, newProf).then((saved) => {
                setProfile({ ...saved, uid: sUser.id, isPremium: isAdmin, role: isAdmin ? 'admin' : 'user' });
                setLoading(false);
                clearTimeout(failsafe);
              });
            } else {
              setProfile({
                ...prof,
                uid: sUser.id,
                isPremium: isAdmin || prof.isPremium || false,
                role: isAdmin ? 'admin' : 'user'
              });
              setLoading(false);
              clearTimeout(failsafe);
            }
          }).catch((err) => {
            console.error("AuthContext getProfile err:", err);
            setLoading(false);
            clearTimeout(failsafe);
          });
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
          clearTimeout(failsafe);
        }
      }).catch((err) => {
        console.error("AuthContext getSession err:", err);
        setLoading(false);
        clearTimeout(failsafe);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("AuthContext onAuthStateChange:", event, session?.user?.email);

        if (session?.user) {
          const sUser = session.user;
          const mappedUser = {
            uid: sUser.id,
            id: sUser.id,
            email: sUser.email || '',
            displayName: sUser.user_metadata?.displayName || sUser.user_metadata?.full_name || 'User',
            photoURL: sUser.user_metadata?.avatar_url || '',
          };
          setUser(mappedUser);
          
          let prof = await getProfile(sUser.id);
          const isAdmin = ADMIN_EMAILS.includes(sUser.email || '');
          if (!prof) {
            prof = await saveProfile(sUser.id, {
              uid: sUser.id,
              email: sUser.email || '',
              displayName: mappedUser.displayName,
              photoURL: mappedUser.photoURL,
              isPremium: isAdmin,
              createdAt: new Date().toISOString(),
              role: isAdmin ? 'admin' : 'user'
            });
          }
          setProfile({
            ...prof,
            uid: sUser.id,
            isPremium: isAdmin || prof.isPremium || false,
            role: isAdmin ? 'admin' : 'user'
          });
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
        clearTimeout(failsafe);
      });

      return () => {
        subscription.unsubscribe();
        clearTimeout(failsafe);
      };
    } else {
      // Mock session restoration
      const stored = localStorage.getItem('mock_auth_session');
      if (stored) {
        try {
          const mUser = JSON.parse(stored);
          setTimeout(() => setUser(mUser), 0);
          
          const getMockProfile = async () => {
            try {
              const prof = await getProfile(mUser.uid);
              const isAdmin = ADMIN_EMAILS.includes(mUser.email || '');
              if (prof) {
                setProfile({
                  ...prof,
                  uid: mUser.uid,
                  isPremium: isAdmin || prof.isPremium || false,
                  role: isAdmin ? 'admin' : 'user'
                });
              } else {
                setProfile({
                  uid: mUser.uid,
                  email: mUser.email || '',
                  displayName: mUser.displayName || 'User',
                  photoURL: mUser.photoURL || '',
                  isPremium: isAdmin,
                  createdAt: new Date().toISOString(),
                  role: isAdmin ? 'admin' : 'user'
                } as UserProfile);
              }
            } catch (err) {
              console.error("Error in getMockProfile:", err);
            } finally {
              setLoading(false);
              clearTimeout(failsafe);
            }
          };
          getMockProfile();
        } catch (e) {
          localStorage.removeItem('mock_auth_session');
          setTimeout(() => { setLoading(false); clearTimeout(failsafe); }, 0);
        }
      } else {
        setTimeout(() => { setLoading(false); clearTimeout(failsafe); }, 0);
      }
      
      return () => {
        clearTimeout(failsafe);
      }
    }
  }, []);

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } else {
      const mockId = 'mock-google-user-123';
      const mockUser = {
        uid: mockId,
        id: mockId,
        email: 'mock-user@gmail.com',
        displayName: 'Mock Explorer',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
      };
      
      localStorage.setItem('mock_auth_session', JSON.stringify(mockUser));
      setUser(mockUser);
      
      const adminEmails = ADMIN_EMAILS;
      let prof = await getProfile(mockId);
      if (!prof) {
        prof = await saveProfile(mockId, {
          uid: mockId,
          email: 'mock-user@gmail.com',
          displayName: 'Mock Explorer',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
          isPremium: false,
          createdAt: new Date().toISOString(),
          role: 'user'
        });
      }
      setProfile({
        ...prof,
        uid: mockId,
        isPremium: prof.isPremium || false,
        role: 'user'
      });
      closeAuthModal();
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
      });
      if (error) throw error;
      closeAuthModal();
    } else {
      const mockId = `mock-usr-${email.replace(/[^a-zA-Z0-9]/g, '-')}`;
      const mockUser = {
        uid: mockId,
        id: mockId,
        email,
        displayName: email.split('@')[0],
        photoURL: ''
      };
      
      localStorage.setItem('mock_auth_session', JSON.stringify(mockUser));
      setUser(mockUser);
      
      const isAdmin = ADMIN_EMAILS.includes(email);
      let prof = await getProfile(mockId);
      if (!prof) {
        prof = await saveProfile(mockId, {
          uid: mockId,
          email,
          displayName: email.split('@')[0],
          photoURL: '',
          isPremium: isAdmin,
          createdAt: new Date().toISOString(),
          role: isAdmin ? 'admin' : 'user'
        });
      }
      setProfile({
        ...prof,
        uid: mockId,
        isPremium: isAdmin || prof.isPremium || false,
        role: isAdmin ? 'admin' : 'user'
      });
      closeAuthModal();
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            displayName: name
          }
        }
      });
      if (error) throw error;
      
      if (data.user) {
        const isAdmin = ADMIN_EMAILS.includes(email);
        await saveProfile(data.user.id, {
          uid: data.user.id,
          email,
          displayName: name,
          photoURL: '',
          isPremium: isAdmin,
          createdAt: new Date().toISOString(),
          role: isAdmin ? 'admin' : 'user'
        });
      }
      closeAuthModal();
    } else {
      const mockId = `mock-usr-${email.replace(/[^a-zA-Z0-9]/g, '-')}`;
      const mockUser = {
        uid: mockId,
        id: mockId,
        email,
        displayName: name,
        photoURL: ''
      };
      
      localStorage.setItem('mock_auth_session', JSON.stringify(mockUser));
      setUser(mockUser);
      
      const isAdmin = ADMIN_EMAILS.includes(email);
      const prof = await saveProfile(mockId, {
        uid: mockId,
        email,
        displayName: name,
        photoURL: '',
        isPremium: isAdmin,
        createdAt: new Date().toISOString(),
        role: isAdmin ? 'admin' : 'user'
      });
      
      setProfile({
        ...prof,
        uid: mockId,
        isPremium: isAdmin || prof.isPremium || false,
        role: isAdmin ? 'admin' : 'user'
      });
      closeAuthModal();
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('mock_auth_session');
      setUser(null);
      setProfile(null);
    }
  };

  const upgradeToPremium = async () => {
    if (user) {
      const updated = await saveProfile(user.uid, { isPremium: true, subscriptionTier: 'premium' });
      setProfile(prev => prev ? { ...prev, ...updated, isPremium: true, subscriptionTier: 'premium' } : null);
    }
  };

  const updateSubscription = async (tier: string, expiry: string) => {
    if (user) {
      const updated = await saveProfile(user.uid, { subscriptionTier: tier, subscriptionExpiry: expiry, isPremium: true });
      setProfile(prev => prev ? { ...prev, ...updated, subscriptionTier: tier, subscriptionExpiry: expiry, isPremium: true } : null);
    }
  };

  const updateProfileImage = async (url: string) => {
    if (user) {
      const updated = await saveProfile(user.uid, { photoURL: url });
      setProfile(prev => ({ ...(prev as any), ...updated, photoURL: url }));
    }
  };

  const updateProfileData = async (data: any) => {
    if (user) {
      const updated = await saveProfile(user.uid, data);
      setProfile(prev => ({ ...(prev as any), ...updated }));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, isOffline,
      signInWithGoogle, signInWithEmail, signUpWithEmail, 
      logout, upgradeToPremium, updateSubscription, updateProfileImage, updateProfileData,
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
