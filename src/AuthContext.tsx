/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

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
  user: User | null;
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
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Real-time listener for profile
        const userRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const isAdmin = ADMIN_EMAILS.includes(user.email || '');
            setProfile({
              uid: user.uid,
              email: user.email || '',
              displayName: data.displayName || user.displayName || 'User',
              photoURL: data.photoURL || user.photoURL || '',
              isPremium: isAdmin || data.isPremium || false,
              subscriptionTier: data.subscriptionTier,
              subscriptionExpiry: data.subscriptionExpiry,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
              role: isAdmin ? 'admin' : 'user',
              phoneNumber: data.phoneNumber,
              trialClaimed: data.trialClaimed,
              trialStartedAt: data.trialStartedAt,
              trialEndsAt: data.trialEndsAt
            } as UserProfile);
          } else {
            // Create profile if missing
            const isAdmin = ADMIN_EMAILS.includes(user.email || '');
            const newProfileData = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'User',
              photoURL: user.photoURL || '',
              isPremium: isAdmin,
              createdAt: serverTimestamp(),
              role: isAdmin ? 'admin' : 'user'
            };
            setDoc(userRef, newProfileData).catch(console.error);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile snapshot error:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      closeAuthModal();
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    closeAuthModal();
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email,
        displayName: name,
        createdAt: serverTimestamp(),
        role: 'user',
        isPremium: false
      });
    }
    closeAuthModal();
  };

  const logout = async () => {
    await signOut(auth);
  };

  const upgradeToPremium = async () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { isPremium: true, subscriptionTier: 'premium' });
    }
  };

  const updateSubscription = async (tier: string, expiry: string) => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { subscriptionTier: tier, subscriptionExpiry: expiry, isPremium: true });
    }
  };

  const updateProfileImage = async (url: string) => {
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { photoURL: url });
        console.log('Firestore photoURL updated to:', url);
      } catch (error) {
        console.error('Error updating profile image:', error);
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, isOffline,
      signInWithGoogle, signInWithEmail, signUpWithEmail, 
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
