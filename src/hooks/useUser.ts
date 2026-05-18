import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

export interface UserData {
  id: string;
  email: string;
  plan: 'basic' | 'premium';
  trial_start: string | null;
  trial_end: string | null;
  scan_count: number;
  scan_month: string;
  isPremium?: boolean;
}

export function useUser() {
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authUser) {
      setUserData(null);
      setIsLoading(false);
      return;
    }

    const userRef = doc(db, 'users', authUser.uid);
    
    // Listen for changes
    const unsubscribe = onSnapshot(userRef, async (snapshot) => {
      if (snapshot.exists()) {
        let currentData = snapshot.data() as any;
        const isAdmin = ['aethelcare.help@gmail.com', 'hello@aethelcare.xyz', 'raisahab2727@gmail.com'].includes(currentData.email || '');
        
        let shouldUpdate = false;
        
        // Trial expiry check (Legacy)
        if (currentData.plan === 'premium' && currentData.trial_end) {
          const trialEnd = new Date(currentData.trial_end);
          if (trialEnd < new Date()) {
            currentData.plan = 'basic';
            shouldUpdate = true;
          }
        }
        
        // Trial expiry check (New profile fields)
        if (currentData.trialClaimed && currentData.trialEndsAt && currentData.isPremium) {
          if (new Date(currentData.trialEndsAt) < new Date() && !currentData.subscriptionExpiry) {
             currentData.isPremium = false;
             currentData.subscriptionTier = 'basic';
             shouldUpdate = true;
          }
        }

        // Subscription expiry check
        if (currentData.isPremium && currentData.subscriptionExpiry) {
           if (new Date(currentData.subscriptionExpiry) < new Date()) {
              currentData.isPremium = false;
              currentData.subscriptionTier = 'basic';
              shouldUpdate = true;
           }
        }

        if (shouldUpdate) {
           await updateDoc(userRef, { 
             plan: currentData.plan || 'basic',
             isPremium: currentData.isPremium || false,
             subscriptionTier: currentData.subscriptionTier || 'basic'
           });
           return;
        }
        
        setUserData({ ...currentData, id: snapshot.id });
      } else {
        // Create initial if missing
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(now.getDate() + 14);
        
        const initial = {
          email: authUser.email || '',
          plan: 'premium' as const,
          trial_start: now.toISOString(),
          trial_end: trialEnd.toISOString(),
          scan_count: 0,
          scan_month: now.toISOString().slice(0, 10),
          createdAt: serverTimestamp()
        };
        await setDoc(userRef, initial);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [authUser]);

  // Derived state
  const isAdmin = ['aethelcare.help@gmail.com', 'hello@aethelcare.xyz', 'raisahab2727@gmail.com'].includes(userData?.email || '');
  const isPremium = isAdmin || userData?.plan === 'premium' || (userData as any)?.isPremium === true;
  
  let scansRemaining = 3;
  if (isPremium) {
    scansRemaining = 9999;
  } else if (userData) {
    const currentDay = new Date().toISOString().slice(0, 10);
    if (userData.scan_month !== currentDay) {
      scansRemaining = 3;
    } else {
      scansRemaining = Math.max(0, 3 - (userData.scan_count || 0));
    }
  }
  
  let trialDaysLeft = 0;
  if (userData?.trial_end) {
    const end = new Date(userData.trial_end).getTime();
    const now = new Date().getTime();
    trialDaysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  return {
    user: authUser ? {
      ...authUser,
      id: authUser.uid,
      uid: authUser.uid,
      email: authUser.email,
      plan: userData?.plan || 'basic',
      isPremium,
      scansRemaining,
      trialDaysLeft,
    } : null,
    isLoading,
    refreshUser: () => {} // Handled by onSnapshot
  };
}
