import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUnifiedAuth } from './UnifiedAuthContext';
import { supabase } from '../lib/supabase';

const SiteBrandingContext = createContext<{ siteName: string | null }>({ siteName: null });

export function SiteBrandingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUnifiedAuth();
  const [siteName, setSiteName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSiteName(null);
      return;
    }
    
    // Safely fetch white label client info with error handling
    const fetchWhiteLabelInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('white_label_clients')
          .select('display_name')
          .eq('owner_id', user.id);
        
        if (error) {
          // If table doesn't exist or other error, just set to null (default branding)
          console.warn('White label client fetch failed:', error.message);
          setSiteName(null);
        } else {
          // Take the first white label client if multiple exist, or null if none exist
          setSiteName(Array.isArray(data) && data.length > 0 ? data[0]?.display_name || null : null);
        }
      } catch (err) {
        console.warn('White label client fetch error:', err);
        setSiteName(null);
      }
    };
    
    fetchWhiteLabelInfo();
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