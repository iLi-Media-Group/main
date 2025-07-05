import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const SiteBrandingContext = createContext<{ siteName: string | null }>({ siteName: null });

export function SiteBrandingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [siteName, setSiteName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSiteName(null);
      return;
    }
    
    // Safely fetch white label client info with error handling
    supabase
      .from('white_label_clients')
      .select('display_name')
      .eq('owner_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // If table doesn't exist or other error, just set to null (default branding)
          console.warn('White label client fetch failed:', error.message);
          setSiteName(null);
        } else {
          setSiteName(data?.display_name || null);
        }
      });
  }, [user]);

  return (
    <SiteBrandingContext.Provider value={{ siteName }}>
      {children}
    </SiteBrandingContext.Provider>
  );
}

export function useSiteBranding() {
  return useContext(SiteBrandingContext);
} 