import React, { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import { supabase } from '../lib/supabase';

const FloatingLogo = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'logo_url')
        .single();

      if (!error && data) {
        setLogoUrl(data.value);
      }
    };

    fetchLogo();
  }, []);

  return (
    <div className="fixed top-1/2 right-8 transform -translate-y-1/2 z-40">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="MyBeatFi Sync"
          className="h-32 w-auto object-contain drop-shadow-lg"
          style={{ 
            border: 'none', 
            boxShadow: 'none', 
            background: 'transparent', 
            padding: 0, 
            margin: 0,
            mixBlendMode: 'normal',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
          }}
        />
      ) : (
        <div className="h-32 w-32 flex items-center justify-center">
          <Music className="w-full h-full text-blue-400 drop-shadow-lg" />
        </div>
      )}
    </div>
  );
};

export default FloatingLogo;
