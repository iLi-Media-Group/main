import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getUserSubscription, getMembershipPlanFromPriceId } from '../lib/stripe';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accountType: 'client' | 'producer' | 'admin' | 'white_label' | null;
  membershipPlan: 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access' | null;
  needsPasswordSetup: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMembership: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accountType, setAccountType] = useState<'client' | 'producer' | 'admin' | 'white_label' | null>(null);
  const [membershipPlan, setMembershipPlan] = useState<'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access' | null>(null);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAccountType = async (userId: string, email: string) => {
    try {
      // Check if user is an admin
      if (['knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com'].includes(email.toLowerCase())) {
        setAccountType('admin');
        setNeedsPasswordSetup(false);
        return;
      }

      // Check if this email is associated with a white label client
      const { data: whiteLabelData, error: whiteLabelError } = await supabase
        .from('white_label_clients')
        .select('owner_email')
        .eq('owner_email', email)
        .maybeSingle();

      if (whiteLabelData) {
        // This is a white label client
        setAccountType('white_label');
        
        // Check if they have a profile and if they need password setup
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('email', email)
          .maybeSingle();

        if (profileError || !profileData) {
          // No profile exists, they need to set up their password
          setNeedsPasswordSetup(true);
        } else {
          setNeedsPasswordSetup(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('account_type, membership_plan')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: email,
              account_type: 'client', // Default to client
              membership_plan: 'Single Track'
            });
            
          if (insertError) {
            console.error('Error creating profile:', {
              message: (insertError as any)?.message,
              details: (insertError as any)?.details,
              hint: (insertError as any)?.hint,
              error: insertError
            });
            setAccountType('client');
            setNeedsPasswordSetup(false);
            return;
          }
          
          setAccountType('client');
          setMembershipPlan('Single Track');
          setNeedsPasswordSetup(false);
          return;
        } else {
          console.error('Error fetching account type:', {
            message: (error as any)?.message,
            details: (error as any)?.details,
            hint: (error as any)?.hint,
            error
          });
          // Default to client if there's an error
          setAccountType('client');
          setNeedsPasswordSetup(false);
          return;
        }
      }
      
      if (data) {
        setAccountType(data.account_type as 'client' | 'producer' | 'white_label');
        setMembershipPlan(data.membership_plan as 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access' | null);
        setNeedsPasswordSetup(false);
        
        // If the user is a client, check for subscription
        if (data.account_type === 'client') {
          try {
            const subscription = await getUserSubscription();
            
            if (subscription?.subscription_id && (subscription?.status === 'active' || subscription?.subscription_status === 'active')) {
              // Update membership plan in profile based on subscription
              const newMembershipPlan = getMembershipPlanFromPriceId(subscription.price_id);
              
              if (newMembershipPlan !== data.membership_plan) {
                await supabase
                  .from('profiles')
                  .update({ membership_plan: newMembershipPlan })
                  .eq('id', userId);
                  
                setMembershipPlan(newMembershipPlan as 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access');
              }
            }
          } catch (subError) {
            console.error('Error checking subscription:', {
              message: (subError as any)?.message,
              details: (subError as any)?.details,
              hint: (subError as any)?.hint,
              error: subError
            });
          }
        }
      } else {
        setAccountType('client'); // Default to client if no profile found
        setNeedsPasswordSetup(false);
      }
    } catch (error) {
      console.error('Error fetching account type:', {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        error
      });
      setAccountType(null);
      setNeedsPasswordSetup(false);
    }
  };

  const refreshMembership = async () => {
    if (!user) return;
    try {
      console.log("Refreshing membership info for user:", user.id);
      
      // Fetch user profile first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('membership_plan, account_type')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile data:', profileError);
        throw profileError;
      }
      
      console.log("Current profile membership_plan:", profileData.membership_plan);
      
      // Check for active subscription
      const subscription = await getUserSubscription();
      console.log("Stripe subscription data:", subscription);
      
      if (subscription?.subscription_id && (subscription?.status === 'active' || subscription?.subscription_status === 'active')) {
        // Get membership plan from subscription
        const newMembershipPlan = getMembershipPlanFromPriceId(subscription.price_id);
        console.log("Current subscription plan from Stripe:", newMembershipPlan);
        
        // Always update the profile, even if it matches
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ membership_plan: newMembershipPlan })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('Error updating membership_plan in profiles:', updateError);
        } else {
          console.log('Updated profiles.membership_plan to', newMembershipPlan);
        }
        
        setMembershipPlan(newMembershipPlan as 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access');
      } else {
        console.log('No active subscription found, using profile data:', profileData.membership_plan);
        console.log('Subscription details:', {
          subscription_id: subscription?.subscription_id,
          status: subscription?.status,
          price_id: subscription?.price_id
        });
        
        // Check if user has a Stripe customer record
        const { data: customerData } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        console.log('Stripe customer data:', customerData);
        
        setMembershipPlan(profileData.membership_plan as 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access' | null);
      }
      
      // Also update account type if needed
      if (profileData.account_type) {
        setAccountType(profileData.account_type as 'client' | 'producer');
      }
      
      console.log("Membership refresh completed. Final membership plan:", profileData.membership_plan);
    } catch (error) {
      console.error('Error refreshing membership:', {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        error
      });
      
      // Fallback: try to get the profile data even if subscription check fails
      try {
        const { data: fallbackProfile } = await supabase
          .from('profiles')
          .select('membership_plan, account_type')
          .eq('id', user.id)
          .single();
        
        if (fallbackProfile) {
          console.log('Using fallback profile data:', fallbackProfile.membership_plan);
          setMembershipPlan(fallbackProfile.membership_plan as 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access' | null);
          if (fallbackProfile.account_type) {
            setAccountType(fallbackProfile.account_type as 'client' | 'producer');
          }
        }
      } catch (fallbackError) {
        console.error('Fallback profile fetch also failed:', fallbackError);
      }
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAccountType(session.user.id, session.user.email || '');
      }
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAccountType(session.user.id, session.user.email || '');
      } else {
        setAccountType(null);
        setMembershipPlan(null);
        setNeedsPasswordSetup(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time subscription to profile changes for membership plan updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile updated via real-time:', payload);
          if (payload.new && payload.new.membership_plan) {
            const newPlan = payload.new.membership_plan as 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access';
            console.log('Updating membership plan via real-time:', newPlan);
            setMembershipPlan(newPlan);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Sign in error:', {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        error
      });
      return { error };
    }
    if (data.user) {
      try {
        await fetchAccountType(data.user.id, data.user.email || '');
      } catch (err) {
        console.error('Error fetching account type after sign in:', {
          message: (err as any)?.message,
          details: (err as any)?.details,
          hint: (err as any)?.hint,
          error: err
        });
        // Default to client if there's an error
        setAccountType('client');
        setNeedsPasswordSetup(false);
      }
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    // First check if a profile already exists with this email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      throw new Error('An account with this email already exists');
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            account_type: 'client', // Default to client for new signups
            membership_plan: 'Single Track' // Default membership plan
          });

        if (profileError) throw profileError;
        setAccountType('client');
        setMembershipPlan('Single Track');
      } catch (err) {
        // If profile creation fails, clean up by deleting the auth user
        await supabase.auth.admin.deleteUser(data.user.id);
        throw err;
      }
    }
  };

  const signOut = async () => {
    try {
      // Always attempt to sign out, regardless of session state
      const { error } = await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token'); // Force clear session
      if (error) {
        console.warn('Error during sign out:', {
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          error
        });
      }
    } catch (error) {
      console.warn('Unexpected error during sign out:', {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        error
      });
    } finally {
      // Always clear the local state
      setUser(null);
      setAccountType(null);
      setMembershipPlan(null);
      setNeedsPasswordSetup(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      accountType, 
      membershipPlan,
      needsPasswordSetup,
      signIn, 
      signUp, 
      signOut,
      refreshMembership
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
