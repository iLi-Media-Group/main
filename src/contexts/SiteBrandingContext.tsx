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
    supabase
      .from('white_label_clients')
      .select('display_name')
      .eq('owner_id', user.id)
      .single()
      .then(({ data }) => {
        setSiteName(data?.display_name || null);
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