import { ReportBackgroundPicker } from './ReportBackgroundPicker';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

interface AdminSettingsProps {
  clientId: string;
}

export function AdminSettings({ clientId }: AdminSettingsProps) {
  const [selectedBackground, setSelectedBackground] = useState('/report-backgrounds/option1.png');
  const [loading, setLoading] = useState(false);

  // Load background from DB
  useEffect(() => {
    async function fetchBackground() {
      setLoading(true);
      const { data } = await supabase
        .from('white_label_clients')
        .select('report_background')
        .eq('id', clientId)
        .single();
      setSelectedBackground(data?.report_background || '/report-backgrounds/option1.png');
      setLoading(false);
    }
    if (clientId) fetchBackground();
  }, [clientId]);

  // Save background to DB
  const handleBackgroundChange = async (path: string) => {
    setSelectedBackground(path);
    await supabase
      .from('white_label_clients')
      .update({ report_background: path })
      .eq('id', clientId);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Choose Report Background</h2>
      <ReportBackgroundPicker selected={selectedBackground} onChange={handleBackgroundChange} />
      {/* ...other settings... */}
    </div>
  );
} 