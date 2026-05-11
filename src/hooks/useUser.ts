import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { getProfile, saveProfile, isSupabaseConfigured, supabase } from '../supabase';

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

    let isMounted = true;

    const loadUserData = async () => {
      try {
        const prof = await getProfile(authUser.uid);
        
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 10);
        
        let initialData: UserData;
        
        if (prof) {
          initialData = {
            id: authUser.uid,
            email: prof.email || authUser.email || '',
            plan: prof.plan || prof.subscriptionTier || 'premium',
            trial_start: prof.trial_start || prof.trialStartedAt || now.toISOString(),
            trial_end: prof.trial_end || prof.trialEndsAt || new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            scan_count: prof.scan_count || 0,
            scan_month: prof.scan_month || currentMonth,
            isPremium: prof.isPremium || false
          };
        } else {
          const trialEnd = new Date(now);
          trialEnd.setDate(now.getDate() + 14);
          
          initialData = {
            id: authUser.uid,
            email: authUser.email || '',
            plan: 'premium',
            trial_start: now.toISOString(),
            trial_end: trialEnd.toISOString(),
            scan_count: 0,
            scan_month: currentMonth,
            isPremium: false
          };
          
          await saveProfile(authUser.uid, {
            email: initialData.email,
            plan: initialData.plan,
            trial_start: initialData.trial_start,
            trial_end: initialData.trial_end,
            scan_count: initialData.scan_count,
            scan_month: initialData.scan_month,
            isPremium: initialData.isPremium
          });
        }

        // Validate plan expiry
        if (initialData.plan === 'premium' && initialData.trial_end) {
          const trialEnd = new Date(initialData.trial_end);
          if (trialEnd < now) {
            initialData.plan = 'basic';
            initialData.isPremium = false;
            await saveProfile(authUser.uid, { plan: 'basic', isPremium: false });
          }
        }

        if (isMounted) {
          setUserData(initialData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error loading user data from Supabase:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadUserData();

    // If Supabase is configured, subscribe to realtime profile updates
    let channel: any = null;
    if (isSupabaseConfigured()) {
      channel = supabase
        .channel(`public:profiles:id=eq.${authUser.uid}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${authUser.uid}` },
          (payload) => {
            if (payload.new && isMounted) {
              const updatedProf = payload.new as any;
              setUserData(prev => prev ? {
                ...prev,
                plan: updatedProf.plan || updatedProf.subscriptionTier || prev.plan,
                trial_start: updatedProf.trial_start || updatedProf.trialStartedAt || prev.trial_start,
                trial_end: updatedProf.trial_end || updatedProf.trialEndsAt || prev.trial_end,
                scan_count: updatedProf.scan_count !== undefined ? updatedProf.scan_count : prev.scan_count,
                scan_month: updatedProf.scan_month || prev.scan_month,
                isPremium: updatedProf.isPremium !== undefined ? updatedProf.isPremium : prev.isPremium,
              } : null);
            }
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [authUser]);

  // Derived state
  const isAdmin = ['aethelcare.help@gmail.com', 'raisahab2727@gmail.com'].includes(userData?.email || '');
  const isPremium = isAdmin || userData?.plan === 'premium' || userData?.isPremium === true;
  
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
    refreshUser: async () => {
      if (authUser) {
        const prof = await getProfile(authUser.uid);
        if (prof) {
          setUserData(prev => prev ? {
            ...prev,
            plan: prof.plan || prof.subscriptionTier || prev.plan,
            trial_start: prof.trial_start || prof.trialStartedAt || prev.trial_start,
            trial_end: prof.trial_end || prof.trialEndsAt || prev.trial_end,
            scan_count: prof.scan_count !== undefined ? prof.scan_count : prev.scan_count,
            scan_month: prof.scan_month || prev.scan_month,
            isPremium: prof.isPremium !== undefined ? prof.isPremium : prev.isPremium,
          } : null);
        }
      }
    }
  };
}
