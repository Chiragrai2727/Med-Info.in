import { createClient } from '@supabase/supabase-js';

// Use import.meta.env for Vite instead of process.env (Next.js)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

// Browser client for general usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side / Admin client (Optional)
 * This should ONLY be used in secure server environments (like server.ts),
 * never in the browser, if using the Service Role Key to bypass RLS.
 * Since this is a Vite SPA, we export the standard client, but if you add a backend route,
 * you would initialize this with the service role key there.
 */
export const createServerClient = (serviceRoleKey: string) => {
  return createClient(supabaseUrl, serviceRoleKey);
};
