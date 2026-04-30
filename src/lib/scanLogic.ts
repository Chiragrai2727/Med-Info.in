import { supabase } from '../supabase';

/**
 * Validates if the user is allowed to perform a scan and increments their usage counter if applicable.
 * @param userId UID of the user from Supabase Auth
 * @returns Object indicating if scan is allowed, and details about limits.
 */
export async function checkAndIncrementScan(userId: string): Promise<{ 
  allowed: boolean; 
  reason?: string; 
  isPremium?: boolean; 
  remaining?: number 
}> {
  try {
    const { data: userData, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      return { allowed: false, reason: 'user_not_found' };
    }

    const isAdmin = ['aethelcare.help@gmail.com'].includes(userData.email || '');

    const currentDay = new Date().toISOString().slice(0, 10);
    let currentCount = userData.scan_count || 0;
    
    // Check for daily reset
    if (userData.scan_month !== currentDay) {
      currentCount = 0;
      await supabase.from('profiles').update({ scan_count: 0, scan_month: currentDay }).eq('id', userId);
    }

    if (userData.plan === 'premium' || isAdmin || userData.isPremium) {
      return { allowed: true, isPremium: true };
    }

    if (currentCount >= 3) {
      return { allowed: false, reason: 'limit_reached' };
    }

    const newCount = currentCount + 1;
    await supabase.from('profiles').update({ scan_count: newCount, scan_month: currentDay }).eq('id', userId);

    return { allowed: true, remaining: 3 - newCount };

  } catch (error) {
    console.error('Unexpected error in checkAndIncrementScan:', error);
    return { allowed: false, reason: 'unexpected_error' };
  }
}
