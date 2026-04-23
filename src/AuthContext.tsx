import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import { sendWelcomeEmail } from './services/emailService';

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
  trialExpiredSmsSent?: boolean;
}

interface AuthContextType {
  user: User | null;
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser ? 'User logged in' : 'User logged out');
      if (currentUser) {
        setUser(currentUser);
        // Try to fetch profile from Firestore (works offline too due to persistence)
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            let profileData = userSnap.data() as UserProfile;
            let needsUpdate = false;
            
            // Auto-migration for admin role
            if (currentUser.email === 'aethelcare.help@gmail.com' && profileData.role !== 'admin') {
              profileData = { ...profileData, role: 'admin' };
              needsUpdate = true;
            }

            // Auto-demote unauthorized admins (fixes issue where users manually got admin tag somehow)
            if (currentUser.email !== 'aethelcare.help@gmail.com' && profileData.role === 'admin') {
              profileData = { ...profileData, role: 'user' };
              needsUpdate = true;
            }

            // Auto-demote legacy users who accidentally have premium without an expiry date
            if (profileData.isPremium && !profileData.subscriptionExpiry && profileData.role !== 'admin') {
              profileData = { ...profileData, isPremium: false };
              needsUpdate = true;
            }

            if (needsUpdate) {
              try {
                await setDoc(userRef, profileData, { merge: true });
              } catch (e) {
                console.error('Failed to auto-migrate user profile', e);
              }
            }

            setProfile(profileData);
            // Cache profile locally for offline access
            localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(profileData));
          } else {
            console.log('No profile found, creating one...');
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              isPremium: false,
              createdAt: new Date().toISOString(),
              role: currentUser.email === 'aethelcare.help@gmail.com' ? 'admin' : 'user'
            };
            try {
              await setDoc(userRef, newProfile);
              localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(newProfile));
              setProfile(newProfile);
              
              // Send the welcome email
              if (newProfile.email) {
                sendWelcomeEmail({
                  to_email: newProfile.email,
                  to_name: newProfile.displayName || newProfile.email.split('@')[0]
                });
              }
            } catch (error) {
              console.error('Error creating profile:', error);
              // Don't throw here, just log. This prevents the ErrorBoundary from triggering
              // if the user is just setting up their Firebase project.
            }
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          // If Firestore fails (e.g. truly offline and not cached yet), try local storage
          const cachedProfile = localStorage.getItem(`profile_${currentUser.uid}`);
          if (cachedProfile) {
            setProfile(JSON.parse(cachedProfile));
          }
          // Log the error but don't throw to prevent app crash
          console.warn('Firestore profile fetch failed. Check your Firebase configuration and authorized domains.');
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (isOffline) {
      throw new Error('Google Sign-In is not available offline.');
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string, rememberMe: boolean = false) => {
    if (isOffline) {
      // Offline Sign-In Logic
      const savedCreds = localStorage.getItem('offline_creds');
      if (savedCreds) {
        const creds = JSON.parse(savedCreds);
        const userCreds = creds[email.toLowerCase()];
        
        // Simple obfuscation check (Base64)
        if (userCreds && btoa(pass) === userCreds.password) {
          // Mock a user object for offline mode
          const mockUser = {
            uid: userCreds.uid,
            email: email,
            displayName: userCreds.displayName,
            photoURL: '',
          } as User;
          
          setUser(mockUser);
          
          const cachedProfile = localStorage.getItem(`profile_${userCreds.uid}`);
          if (cachedProfile) {
            setProfile(JSON.parse(cachedProfile));
          }
          return;
        }
      }
      throw new Error('Invalid credentials or no offline data found for this user.');
    }

    // Online Sign-In
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    
    if (rememberMe && userCredential.user) {
      // Save credentials for offline use
      const savedCreds = localStorage.getItem('offline_creds') || '{}';
      const creds = JSON.parse(savedCreds);
      creds[email.toLowerCase()] = {
        password: btoa(pass), // Obfuscated
        uid: userCredential.user.uid,
        displayName: userCredential.user.displayName
      };
      localStorage.setItem('offline_creds', JSON.stringify(creds));
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (isOffline) {
      throw new Error('Cannot create account while offline.');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
      
      const userRef = doc(db, 'users', userCredential.user.uid);
      const newProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || email,
        displayName: name,
        photoURL: userCredential.user.photoURL || '',
        isPremium: false,
        createdAt: new Date().toISOString(),
        role: 'user'
      };

      try {
        await setDoc(userRef, newProfile, { merge: true });
        localStorage.setItem(`profile_${userCredential.user.uid}`, JSON.stringify(newProfile));
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userCredential.user.uid}`);
      }

      setUser({ ...userCredential.user, displayName: name } as User);
      setProfile(newProfile);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Optional: Clear offline creds on logout if you want strict security
      // localStorage.removeItem('offline_creds');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const upgradeToPremium = async () => {
    if (user && profile) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, { isPremium: true }, { merge: true });
        const updatedProfile = { ...profile, isPremium: true };
        setProfile(updatedProfile);
        localStorage.setItem(`profile_${user.uid}`, JSON.stringify(updatedProfile));
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const updateSubscription = async (tier: string, expiry: string) => {
    if (user && profile) {
      const userRef = doc(db, 'users', user.uid);
      try {
        const updatedProfile = { ...profile, subscriptionTier: tier, subscriptionExpiry: expiry, isPremium: true };
        await setDoc(userRef, updatedProfile);
        setProfile(updatedProfile);
        localStorage.setItem(`profile_${user.uid}`, JSON.stringify(updatedProfile));
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
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
