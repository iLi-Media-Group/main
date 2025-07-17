import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Type for the context
interface ReportBackgroundContextType {
  selectedBackground: string;
  setSelectedBackground: (bg: string) => void;
  loading: boolean;
}

const ReportBackgroundContext = createContext<ReportBackgroundContextType | undefined>(undefined);

export const ReportBackgroundProvider: React.FC<{ clientId?: string | null; children: React.ReactNode }> = ({ clientId, children }) => {
  // Set the default background for main admin or white label
  const defaultBackground = !clientId
    ? '/report-backgrounds/option-mybeatfi.png'
    : '/report-backgrounds/option-neutral.png';

  const [selectedBackground, setSelectedBackground] = useState(defaultBackground);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setSelectedBackground(defaultBackground);
      setLoading(false);
      return;
    }
    setLoading(true);
    async function fetchBackground() {
      const { data } = await supabase
        .from('white_label_clients')
        .select('report_background')
        .eq('id', clientId)
        .single();
      if (data?.report_background) setSelectedBackground(data.report_background);
      setLoading(false);
    }
    fetchBackground();
  }, [clientId]);

  // Save to DB when changed (only for white label clients)
  const handleSetBackground = async (bg: string) => {
    setSelectedBackground(bg);
    if (clientId) {
      await supabase
        .from('white_label_clients')
        .update({ report_background: bg })
        .eq('id', clientId);
    }
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