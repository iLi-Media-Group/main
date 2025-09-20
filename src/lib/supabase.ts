import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'mybeatfi-auth-token', // Custom storage key for better persistence
  },
  // Remove cache-busting headers that cause unnecessary refetches
  global: {
    headers: {
      'X-Client-Info': 'mybeatfi-web'
    }
  }
});

// Note: Admin client should only be used in edge functions, not in frontend
// Service role key should never be exposed to the browser
