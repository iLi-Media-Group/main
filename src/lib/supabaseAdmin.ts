import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// SECURITY: Use only anon key for frontend operations
// Service role key should only be used in edge functions
export const supabaseAdmin = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storageKey: 'mybeatfi-admin-auth'
    }
  }
);

// Note: For admin operations that require service role permissions,
// use edge functions instead of direct frontend access
