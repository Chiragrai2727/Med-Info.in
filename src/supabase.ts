import { createClient } from '@supabase/supabase-js';

// Load credentials with fallback placeholders to prevent crashing on boot
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key-here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Standardised schemas and local fallback helpers for Supabase Client Storage.
 * Dual-writing to Supabase Database AND LocalStorage guarantees robustness and offline readiness!
 */

// Helper to check if Supabase is fully configured with genuine keys
export function isSupabaseConfigured(): boolean {
  return (
    !!import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder-project.supabase.co' &&
    !!import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}

// 1. PROFILE METHODS
export async function getProfile(userId: string) {
  const localKey = `supabase_profile_${userId}`;
  
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (!error && data) {
        localStorage.setItem(localKey, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn("Supabase profiles query error, checking local fallback. Details:", e);
    }
  }
  
  const localCached = localStorage.getItem(localKey);
  return localCached ? JSON.parse(localCached) : null;
}

export async function saveProfile(userId: string, profileData: any) {
  const localKey = `supabase_profile_${userId}`;
  const currentLocal = localStorage.getItem(localKey);
  const existing = currentLocal ? JSON.parse(currentLocal) : {};
  const merged = { ...existing, ...profileData, id: userId };
  
  // Save to local cache first
  localStorage.setItem(localKey, JSON.stringify(merged));
  
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(merged);
      if (error) {
        console.warn("Could not upsert profile on Supabase DB:", error.message);
      }
    } catch (err) {
      console.warn("Error saving profile to Supabase:", err);
    }
  }
  return merged;
}

// 2. SCHEDULES METHODS
export async function getSchedules(userId: string) {
  const localKey = `supabase_schedules_${userId}`;
  
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('userId', userId);
        
      if (!error && data) {
        localStorage.setItem(localKey, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn("Supabase schedules query error, checking local fallback. Details:", e);
    }
  }
  
  const localCached = localStorage.getItem(localKey);
  return localCached ? JSON.parse(localCached) : [];
}

export async function addSchedule(userId: string, scheduleData: any) {
  const localKey = `supabase_schedules_${userId}`;
  const localCached = localStorage.getItem(localKey);
  const currentSchedules = localCached ? JSON.parse(localCached) : [];
  
  const newScheduleItem = {
    id: scheduleData.id || `sch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    medicineName: scheduleData.medicineName || '',
    dosage: scheduleData.dosage || '',
    time: scheduleData.time || '08:00',
    days: scheduleData.days || [],
    frequency: scheduleData.frequency || ' daily',
    times: scheduleData.times || [],
    duration: scheduleData.duration || '',
    instructions: scheduleData.instructions || '',
    start_date: scheduleData.start_date || new Date().toISOString().slice(0, 10),
    notifications_enabled: scheduleData.notifications_enabled !== false,
    lastTakenDate: scheduleData.lastTakenDate || null,
    createdAt: scheduleData.createdAt || new Date().toISOString(),
    updatedAt: scheduleData.updatedAt || new Date().toISOString(),
  };
  
  const updatedSchedules = [...currentSchedules, newScheduleItem];
  localStorage.setItem(localKey, JSON.stringify(updatedSchedules));
  
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('schedules')
        .insert(newScheduleItem);
      if (error) {
        console.warn("Could not insert schedule to Supabase DB:", error.message);
      }
    } catch (err) {
      console.warn("Error inserting schedule to Supabase:", err);
    }
  }
  return newScheduleItem;
}

export async function updateSchedule(userId: string, scheduleId: string, updates: any) {
  const localKey = `supabase_schedules_${userId}`;
  const localCached = localStorage.getItem(localKey);
  const currentSchedules: any[] = localCached ? JSON.parse(localCached) : [];
  
  const updatedSchedules = currentSchedules.map(item => {
    if (item.id === scheduleId) {
      return { ...item, ...updates, updatedAt: new Date().toISOString() };
    }
    return item;
  });
  
  localStorage.setItem(localKey, JSON.stringify(updatedSchedules));
  
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', scheduleId)
        .eq('userId', userId);
      if (error) {
        console.warn("Could not update schedule in Supabase DB:", error.message);
      }
    } catch (err) {
      console.warn("Error updating schedule in Supabase:", err);
    }
  }
}

export async function deleteSchedule(userId: string, scheduleId: string) {
  const localKey = `supabase_schedules_${userId}`;
  const localCached = localStorage.getItem(localKey);
  const currentSchedules: any[] = localCached ? JSON.parse(localCached) : [];
  
  const updatedSchedules = currentSchedules.filter(item => item.id !== scheduleId);
  localStorage.setItem(localKey, JSON.stringify(updatedSchedules));
  
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId)
        .eq('userId', userId);
      if (error) {
        console.warn("Could not delete schedule from Supabase DB:", error.message);
      }
    } catch (err) {
      console.warn("Error deleting schedule from Supabase:", err);
    }
  }
}

// 3. PAYMENTS METHODS
export async function getPayments(userId: string) {
  const localKey = `supabase_payments_${userId}`;
  
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('userId', userId);
        
      if (!error && data) {
        localStorage.setItem(localKey, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn("Supabase payments query error:", e);
    }
  }
  
  const localCached = localStorage.getItem(localKey);
  return localCached ? JSON.parse(localCached) : [];
}

export async function addPayment(userId: string, paymentData: any) {
  const localKey = `supabase_payments_${userId}`;
  const localCached = localStorage.getItem(localKey);
  const currentPayments = localCached ? JSON.parse(localCached) : [];
  
  const newPayment = {
    id: paymentData.id || `pay-${Date.now()}`,
    userId,
    orderId: paymentData.orderId || '',
    amount: paymentData.amount || 0,
    currency: paymentData.currency || 'INR',
    date: paymentData.date || new Date().toISOString(),
    status: paymentData.status || 'success',
    tier: paymentData.tier || 'premium',
  };
  
  const updated = [...currentPayments, newPayment];
  localStorage.setItem(localKey, JSON.stringify(updated));
  
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('payments')
        .insert(newPayment);
      if (error) {
        console.warn("Could not record payment on Supabase DB:", error.message);
      }
    } catch (err) {
      console.warn("Error recording payment to Supabase:", err);
    }
  }
  return newPayment;
}

// 4. FEEDBACK METHODS
export async function addFeedback(userId: string | null, feedbackData: any) {
  const newFeedback = {
    id: `fb-${Date.now()}`,
    userId: userId || 'anonymous',
    userEmail: feedbackData.userEmail || 'anonymous@aethelcare.com',
    rating: feedbackData.rating || 5,
    comment: feedbackData.comment || '',
    createdAt: new Date().toISOString()
  };
  
  // Cache feedback locally as metadata
  const localKey = 'supabase_local_feedbacks';
  const localCached = localStorage.getItem(localKey);
  const updatedList = localCached ? [...JSON.parse(localCached), newFeedback] : [newFeedback];
  localStorage.setItem(localKey, JSON.stringify(updatedList.slice(0, 50)));

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('feedback')
        .insert(newFeedback);
      if (error) {
        console.warn("Could not insert feedback to Supabase DB:", error.message);
      }
    } catch (err) {
      console.warn("Error inserting feedback to Supabase:", err);
    }
  }
  return newFeedback;
}

// 5. CONTACT REQUESTS METHODS
export async function addContactRequest(contactData: any) {
  const newContact = {
    id: `contact-${Date.now()}`,
    name: contactData.name || '',
    email: contactData.email || '',
    subject: contactData.subject || '',
    message: contactData.message || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  const localKey = 'supabase_local_contacts';
  const localCached = localStorage.getItem(localKey);
  const updatedList = localCached ? [...JSON.parse(localCached), newContact] : [newContact];
  localStorage.setItem(localKey, JSON.stringify(updatedList.slice(0, 50)));

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('contactRequests')
        .insert(newContact);
      if (error) {
        console.warn("Could not insert contact request to Supabase DB:", error.message);
      }
    } catch (err) {
      console.warn("Error inserting contact request to Supabase:", err);
    }
  }
  return newContact;
}

// 6. SEARCH ANALYTICS METHODS
export async function trackSearchMetric(queryStr: string) {
  const cleanQuery = queryStr.trim().toLowerCase();
  if (!cleanQuery) return;
  
  if (isSupabaseConfigured()) {
    try {
      // Fetch existing
      const { data, error } = await supabase
        .from('searchAnalytics')
        .select('*')
        .eq('query', cleanQuery)
        .single();
        
      if (!error && data) {
        await supabase
          .from('searchAnalytics')
          .update({ count: (data.count || 0) + 1, updatedAt: new Date().toISOString() })
          .eq('query', cleanQuery);
      } else {
        await supabase
          .from('searchAnalytics')
          .insert({
            query: cleanQuery,
            count: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
      }
    } catch (e) {
      console.warn("Error tracking search analytics on Supabase DB:", e);
    }
  }
}

export async function updateUserPremium(uid: string, isPremium: boolean, plan: string) {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('profiles').update({ isPremium, plan }).eq('id', uid);
    } catch (e) {
      console.warn("Failed to update user premium", e);
    }
  }
}

export async function deleteFeedbackRecord(id: string) {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('feedback').delete().eq('id', id);
    } catch (e) {
      console.warn("Failed to delete feedback", e);
    }
  }
}

export async function updateFeedbackStatus(id: string, status: string) {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('feedback').update({ status }).eq('id', id);
    } catch (e) {
      console.warn("Failed to update feedback status", e);
    }
  }
}

export async function deleteContactRequestRecord(id: string) {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('contactRequests').delete().eq('id', id);
    } catch (e) {
      console.warn("Failed to delete contact request", e);
    }
  }
}

export async function getAllUsers() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('createdAt', { ascending: false });
      if (!error) return data || [];
    } catch (e) {
      console.warn("Failed getting users from Supabase:", e);
    }
  }
  return [];
}

export async function getAllSearchAnalytics() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('searchAnalytics').select('*').order('count', { ascending: false }).limit(50);
      if (!error) return data || [];
    } catch (e) {
      console.warn("Failed getting analytics from Supabase:", e);
    }
  }
  return [];
}

export async function getAllFeedbacks() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('feedback').select('*').order('createdAt', { ascending: false }).limit(100);
      if (!error) return data || [];
    } catch (e) {
      console.warn("Failed getting feedback from Supabase:", e);
    }
  }
  return [];
}

export async function getAllContactRequests() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('contactRequests').select('*').order('createdAt', { ascending: false }).limit(100);
      if (!error) return data || [];
    } catch (e) {
      console.warn("Failed getting contacts from Supabase:", e);
    }
  }
  return [];
}

export async function deleteUserAndData(uid: string) {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('profiles').delete().eq('id', uid);
    } catch (e) {
      console.warn("Failed to delete user profile", e);
    }
  }
}

export async function clearSearchAnalytics() {
  if (isSupabaseConfigured()) {
    try {
      // Basic implementation for deleting records
      await supabase.from('searchAnalytics').delete().neq('id', 'dummy'); 
    } catch (e) {
      console.warn("Failed to clear search analytics", e);
    }
  }
}
