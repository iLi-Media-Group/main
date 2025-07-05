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

    const checkFeatureFlag = async () => {
      try {
        // Check if user is admin (admins have access to all features)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .single();

        if (profileData?.account_type === 'admin') {
          console.log(`Feature ${featureName}: Admin access granted`);
          setIsEnabled(true);
          setLoading(false);
          return;
        }

        // Check if user is a white label client
        if (profileData?.account_type === 'white_label') {
          // Get the client's subscription plan
          const { data: subscriptionData } = await supabase
            .from('stripe_subscriptions')
            .select('white_label_plan, status')
            .eq('customer_id', user.id)
            .eq('status', 'active')
            .single();

          const plan = subscriptionData?.white_label_plan || 'starter';

          // Check if feature is included in the plan
          const isIncludedInPlan = checkFeatureInPlan(featureName, plan);

          if (isIncludedInPlan) {
            setIsEnabled(true);
            setLoading(false);
            return;
          }

          // If not included in plan, check if it's been purchased as an add-on
          const { data: featureData } = await supabase
            .from('white_label_features')
            .select('is_enabled')
            .eq('client_id', user.id)
            .eq('feature_name', featureName)
            .single();

          setIsEnabled(featureData?.is_enabled || false);
        } else {
          // For main site users (non-white-label), enable features based on user type
          // Producers and regular users on the main site should have access to features
          if (profileData?.account_type === 'producer' || profileData?.account_type === 'client') {
            console.log(`Feature ${featureName}: Main site user access granted (${profileData.account_type})`);
            setIsEnabled(true);
          } else {
            console.log(`Feature ${featureName}: Access denied for account type: ${profileData?.account_type}`);
            setIsEnabled(false);
          }
        }
      } catch (error) {
        console.error('Error checking feature flag:', error);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFeatureFlag();
  }, [user, featureName]);

  return { isEnabled, loading };
}

// Helper function to check if a feature is included in a plan
function checkFeatureInPlan(featureName: string, plan: string): boolean {
  switch (featureName) {
    case 'ai_search_assistance':
      return plan === 'enterprise';
    case 'producer_onboarding':
      return plan === 'pro' || plan === 'enterprise';
    case 'deep_media_search':
      return plan === 'enterprise';
    case 'advanced_analytics':
      return plan === 'enterprise';
    default:
      return false;
  }
} 