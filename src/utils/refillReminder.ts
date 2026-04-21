export interface RefillReminder {
  medicine_name: string;
  scan_date: number;
  duration_days: number;
  remind_at: number;
}

const REFILL_KEY = 'aeth_refills_v1';

export function scheduleRefillReminder(medicine: string, durationDays: number): void {
  if (typeof window === 'undefined') return;
  try {
    const store = localStorage.getItem(REFILL_KEY);
    const refills: RefillReminder[] = store ? JSON.parse(store) : [];
    
    // Remind 3 days before supply ends
    let remindDays = durationDays - 3;
    if (remindDays <= 0) remindDays = durationDays; // if short prescription, remind on the day
    
    const now = Date.now();
    const remindAt = now + (remindDays * 24 * 60 * 60 * 1000);
    
    // remove existing to prevent dupes
    const filtered = refills.filter(r => r.medicine_name !== medicine);
    filtered.push({
      medicine_name: medicine,
      scan_date: now,
      duration_days: durationDays,
      remind_at: remindAt
    });
    
    localStorage.setItem(REFILL_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn("Could not schedule refill reminder", e);
  }
}

export function checkDueReminders(): RefillReminder[] {
  if (typeof window === 'undefined') return [];
  try {
    const store = localStorage.getItem(REFILL_KEY);
    if (!store) return [];
    
    const refills: RefillReminder[] = JSON.parse(store);
    const now = Date.now();
    
    // Return any reminders that are due today or past due
    return refills.filter(r => now >= r.remind_at);
  } catch (e) {
    return [];
  }
}

export function dismissReminder(medicine: string): void {
  if (typeof window === 'undefined') return;
  try {
    const store = localStorage.getItem(REFILL_KEY);
    if (!store) return;
    
    let refills: RefillReminder[] = JSON.parse(store);
    refills = refills.filter(r => r.medicine_name !== medicine);
    localStorage.setItem(REFILL_KEY, JSON.stringify(refills));
  } catch (e) {
    console.warn("Could not dismiss refill reminder", e);
  }
}
