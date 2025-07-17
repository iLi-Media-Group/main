import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Type for the context
interface ReportBackgroundContextType {
  selectedBackground: string;
  setSelectedBackground: (bg: string) => void;
  loading: boolean;
}

const ReportBackgroundContext = createContext<ReportBackgroundContextType | undefined>(undefined);

export const ReportBackgroundProvider: React.FC<{ clientId: string; children: React.ReactNode }> = ({ clientId, children }) => {
  // Set the default background based on clientId
  const MYBEATFI_CLIENT_ID = 'YOUR_MYBEATFI_CLIENT_ID'; // TODO: Replace with your actual client ID
  const defaultBackground =
    clientId === MYBEATFI_CLIENT_ID
      ? '/report-backgrounds/option-mybeatfi.png'
      : '/report-backgrounds/option-neutral.png';

  const [selectedBackground, setSelectedBackground] = useState(defaultBackground);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBackground() {
      setLoading(true);
      const { data } = await supabase
        .from('white_label_clients')
        .select('report_background')
        .eq('id', clientId)
        .single();
      if (data?.report_background) setSelectedBackground(data.report_background);
      setLoading(false);
    }
    if (clientId) fetchBackground();
  }, [clientId]);

  // Save to DB when changed
  const handleSetBackground = async (bg: string) => {
    setSelectedBackground(bg);
    await supabase
      .from('white_label_clients')
      .update({ report_background: bg })
      .eq('id', clientId);
  };

  return (
    <ReportBackgroundContext.Provider value={{ selectedBackground, setSelectedBackground: handleSetBackground, loading }}>
      {children}
    </ReportBackgroundContext.Provider>
  );
};

export function useReportBackground() {
  const ctx = useContext(ReportBackgroundContext);
  if (!ctx) throw new Error('useReportBackground must be used within a ReportBackgroundProvider');
  return ctx;
} 