import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

export function useCurrentPlan() {
  const { user } = useUnifiedAuth();
  const [currentPlan, setCurrentPlan] = useState<string>('starter');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCurrentPlan('starter');
      setLoading(false);
      return;
    }

    const getCurrentPlan = async () => {
      try {
        // Check if user is admin
        const { data: profileData } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .single();

        if (profileData?.account_type === 'admin') {
          setCurrentPlan('admin');
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

          setCurrentPlan(subscriptionData?.white_label_plan || 'starter');
        } else {
          setCurrentPlan('starter');
        }
      } catch (error) {
        console.error('Error getting current plan:', error);
        setCurrentPlan('starter');
      } finally {
        setLoading(false);
      }
    };

    getCurrentPlan();
  }, [user]);

  return { currentPlan, loading };
} 