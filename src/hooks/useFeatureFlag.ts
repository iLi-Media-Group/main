import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useFeatureFlag(featureName: string) {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsEnabled(false);
      setLoading(false);
      return;
    }

    checkFeatureStatus();
  }, [user, featureName]);

  const checkFeatureStatus = async () => {
    try {
      setLoading(true);

      // Use the database function to check feature status
      const { data, error } = await supabase.rpc('get_feature_status', {
        feature_name: featureName
      });

      if (error) {
        console.error('Error checking feature status:', error);
        setIsEnabled(false);
      } else {
        setIsEnabled(data || false);
      }
    } catch (err) {
      console.error('Error checking feature status:', err);
      setIsEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  return { isEnabled, loading };
} 