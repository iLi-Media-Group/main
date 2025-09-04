import * as React from 'react';
import { useContext, useState, useEffect } from 'react';
import { WhiteLabelFeatureFlagsContext } from '../contexts/WhiteLabelFeatureFlagsContext';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';

export function useFeatureFlag(featureName: string): { isEnabled: boolean; loading: boolean } {
  const flags = useContext(WhiteLabelFeatureFlagsContext);
  const { user } = useUnifiedAuth();
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

        // Check if user has admin role (supports dual roles like 'admin,producer')
        if (profileData?.account_type && profileData.account_type.includes('admin')) {
          console.log(`Feature ${featureName}: Admin access granted (account_type: ${profileData.account_type})`);
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
          if (profileData?.account_type && (profileData.account_type.includes('producer') || profileData.account_type === 'client')) {
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

  // Add debugging for producer_onboarding feature
  if (featureName === 'producer_onboarding') {
    console.log(`useFeatureFlag('${featureName}'): isEnabled=${isEnabled}, loading=${loading}, user=${user?.email}`);
  }

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