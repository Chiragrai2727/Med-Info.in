import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Validates if the user is allowed to perform a scan and increments their usage counter if applicable.
 * @param userId UID of the user from Firebase Auth
 * @returns Object indicating if scan is allowed, and details about limits.
 */
export async function checkAndIncrementScan(userId: string): Promise<{ 
  allowed: boolean; 
  reason?: string; 
  isPremium?: boolean; 
  remaining?: number 
}> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { allowed: false, reason: 'user_not_found' };
    }

    const userData = userSnap.data();
    const isAdmin = ['aethelcare.help@gmail.com'].includes(userData.email || '');

    const currentDay = new Date().toISOString().slice(0, 10);
    let currentCount = userData.scan_count || 0;
    
    // Check for daily reset
    if (userData.scan_month !== currentDay) {
      currentCount = 0;
      await updateDoc(userRef, { scan_count: 0, scan_month: currentDay });
    }

    if (userData.plan === 'premium' || isAdmin || userData.isPremium) {
      return { allowed: true, isPremium: true };
    }

    if (currentCount >= 3) {
      return { allowed: false, reason: 'limit_reached' };
    }

    const newCount = currentCount + 1;
    await updateDoc(userRef, { scan_count: newCount, scan_month: currentDay });

    return { allowed: true, remaining: 3 - newCount };

  } catch (error) {
    console.error('Unexpected error in checkAndIncrementScan:', error);
    return { allowed: false, reason: 'unexpected_error' };
  }
}
