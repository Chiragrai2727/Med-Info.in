import { supabase } from './supabase';

/**
 * Validates if the user is allowed to perform a scan and increments their usage counter if applicable.
 * @param userId UUID of the user from Supabase Auth
 * @returns Object indicating if scan is allowed, and details about limits.
 */
export async function checkAndIncrementScan(userId: string): Promise<{ 
  allowed: boolean; 
  reason?: string; 
  isPremium?: boolean; 
  remaining?: number 
}> {
  try {
    // 1. Read user's current stats
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('plan, scan_count, scan_month, email')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      console.error('Failed to fetch user scan stats:', fetchError);
      return { allowed: false, reason: 'error_fetching_user' };
    }

    const isAdmin = ['aethelcare.help@gmail.com', 'raisahab2727@gmail.com'].includes(user.email || '');

    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-04"
    let currentCount = user.scan_count || 0;
    
    // 2. Check if we need to reset the counter for a new month
    if (user.scan_month !== currentMonth) {
      currentCount = 0;
      await supabase
        .from('users')
        .update({ scan_count: 0, scan_month: currentMonth })
        .eq('id', userId);
    }

    // 3. Premium tier and admins get unlimited scans
    if (user.plan === 'premium' || isAdmin) {
      return { allowed: true, isPremium: true };
    }

    // 4. Basic tier limit check (Max 3)
    if (currentCount >= 3) {
      return { allowed: false, reason: 'limit_reached' };
    }

    // 5. Basic tier increment
    const newCount = currentCount + 1;
    const { error: updateError } = await supabase
      .from('users')
      .update({ scan_count: newCount, scan_month: currentMonth })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to increment scan count:', updateError);
      return { allowed: false, reason: 'database_error' };
    }

    return { allowed: true, remaining: 3 - newCount };

  } catch (error) {
    console.error('Unexpected error in checkAndIncrementScan:', error);
    return { allowed: false, reason: 'unexpected_error' };
  }
}
