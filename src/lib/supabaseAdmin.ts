import { createClient } from '@supabase/supabase-js';

const supabaseAdminUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseAdminUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase admin environment variables');
}

export const supabaseAdmin = createClient(
  supabaseAdminUrl, 
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storageKey: 'mybeatfi-admin-auth' // Different storage key for admin
    }
  }
);
