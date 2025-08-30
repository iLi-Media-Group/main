import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface WhiteLabelFeatureFlags {
  ai_search_assistance_enabled: boolean;
  producer_onboarding_enabled: boolean;
  deep_media_search_enabled: boolean;
  ai_search_assistance_paid?: boolean;
  producer_onboarding_paid?: boolean;
  deep_media_search_paid?: boolean;
  plan?: string;
}

const WhiteLabelFeatureFlagsContext = createContext<WhiteLabelFeatureFlags | null>(null);

export { WhiteLabelFeatureFlagsContext };
export const useWhiteLabelFeatureFlags = () => useContext(WhiteLabelFeatureFlagsContext);

export function WhiteLabelFeatureFlagsProvider({ clientId, children }: { clientId: string, children: React.ReactNode }) {
  const [flags, setFlags] = useState<WhiteLabelFeatureFlags | null>(null);

  useEffect(() => {
    async function fetchFlags() {
      const { data } = await supabase
        .from('white_label_clients')
        .select('ai_search_assistance_enabled, producer_onboarding_enabled, deep_media_search_enabled, ai_search_assistance_paid, producer_onboarding_paid, deep_media_search_paid, plan')
        .eq('id', clientId)
        .single();
      if (data) setFlags(data);
    }
    if (clientId) fetchFlags();
  }, [clientId]);

  return (
    <WhiteLabelFeatureFlagsContext.Provider value={flags}>
      {children}
    </WhiteLabelFeatureFlagsContext.Provider>
  );
} 