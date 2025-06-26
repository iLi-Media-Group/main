import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type FeatureName = 'ai_recommendations' | 'producer_applications' | 'deep_media_search';

export function useFeatureFlag(featureName: FeatureName) {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsEnabled(false);
      setLoading(false);
      return;
    }

    const checkFeatureFlag = async () => {
      try {
        setLoading(true);
        
        // Check if user is admin (admins have access to all features)
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .single();

        if (profile?.account_type === 'admin') {
          setIsEnabled(true);
          setLoading(false);
          return;
        }

        // Check if user has the specific feature enabled
        const { data: featureData, error } = await supabase
          .from('white_label_features')
          .select('is_enabled')
          .eq('client_id', user.id)
          .eq('feature_name', featureName)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error checking feature flag:', error);
          setIsEnabled(false);
        } else {
          setIsEnabled(featureData?.is_enabled || false);
        }
      } catch (err) {
        console.error('Error checking feature flag:', err);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFeatureFlag();
  }, [user, featureName]);

  return { isEnabled, loading };
} 