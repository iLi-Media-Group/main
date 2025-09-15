import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PitchCheckmarkProps {
  userId: string;
  className?: string;
}

export function PitchCheckmark({ userId, className = '' }: PitchCheckmarkProps) {
  const [hasPitchAccess, setHasPitchAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPitchStatus = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('pitch_subscriptions')
          .select('is_active')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error checking pitch status:', error);
          setHasPitchAccess(false);
        } else {
          setHasPitchAccess(!!data?.is_active);
        }
      } catch (err) {
        console.error('Error checking pitch status:', err);
        setHasPitchAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkPitchStatus();
  }, [userId]);

  if (loading || !hasPitchAccess) {
    return null;
  }

  return (
    <CheckCircle 
      className={`w-5 h-5 text-green-500 ml-2 ${className}`} 
      title="Pitch Enabled"
    />
  );
}
