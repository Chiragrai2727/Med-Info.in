import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface UserData {
  id: string;
  email: string;
  plan: 'basic' | 'premium';
  trial_start: string | null;
  trial_end: string | null;
  scan_count: number;
  scan_month: string;
}

export function useUser() {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSessionUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setUserData(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    setIsLoading(true);
    try {
      // Fetch user profile from public.users table
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // If user does not exist yet (PGRST116), create them and grant the 14-day premium trial
      if (error && error.code === 'PGRST116') {
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(now.getDate() + 14);

        const { data: { user: sessionUserObj } } = await supabase.auth.getUser();

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: sessionUserObj?.email || '',
            plan: 'premium',
            trial_start: now.toISOString(),
            trial_end: trialEnd.toISOString()
          }, { onConflict: 'id' })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newUser;
        error = null;
      } else if (error) {
        throw error;
      }

      let currentData = data as UserData;

      // Part 4 - Trial expiry check
      if (currentData.plan === 'premium' && currentData.trial_end) {
        const trialEnd = new Date(currentData.trial_end);
        const now = new Date();
        
        if (trialEnd < now) {
          // Trial expired, demote to basic
          const { data: updatedData, error: updateError } = await supabase
            .from('users')
            .update({ plan: 'basic' })
            .eq('id', userId)
            .select()
            .single();
            
          if (!updateError && updatedData) {
            currentData = updatedData as UserData;
          }
        }
      }

      setUserData(currentData);
    } catch (err) {
      console.error('Error fetching user data from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate derived state
  const isAdmin = ['aethelcare.help@gmail.com'].includes(userData?.email || '');
  const isPremium = isAdmin || userData?.plan === 'premium';
  
  // Calculate scans remaining today
  let scansRemaining = 3;
  if (isAdmin || isPremium) {
    scansRemaining = 9999;
  } else if (userData?.scan_count !== undefined) {
    // If the scan_month effectively acts as scan_day now or we reset daily using scanLogic
    scansRemaining = Math.max(0, 3 - userData.scan_count);
  }
  
  let trialDaysLeft = 0;
  if (userData?.trial_end) {
    const end = new Date(userData.trial_end).getTime();
    const now = new Date().getTime();
    trialDaysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  return {
    user: sessionUser ? {
      ...sessionUser,
      email: sessionUser.email,
      plan: userData?.plan || 'basic',
      isPremium,
      scansRemaining,
      trialDaysLeft,
    } : null,
    isLoading,
    refreshUser: () => sessionUser && fetchUserData(sessionUser.id)
  };
}
