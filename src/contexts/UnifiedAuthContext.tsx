import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { dataCache, CACHE_KEYS } from '../lib/cache';

interface Profile {
  id: string;
  email: string;
  account_type: 'client' | 'producer' | 'admin' | 'white_label' | 'rights_holder';
  membership_plan: 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access' | null;
  needs_password_setup: boolean;
  
  // Rights holder specific fields (nullable for non-rights holders)
  rights_holder_type?: 'record_label' | 'publisher';
  company_name?: string;
  legal_entity_name?: string;
  business_structure?: 'sole_proprietorship' | 'llc' | 'corporation' | 'partnership' | 'other';
  tax_id?: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  verification_status?: 'pending' | 'verified' | 'rejected' | 'suspended';
  verification_notes?: string;
  is_active?: boolean;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
  rights_authority_declaration_accepted?: boolean;
  rights_authority_declaration_accepted_at?: string;
  contact_person_name?: string;
  contact_person_title?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  logo_url?: string;
  description?: string;
  genres_specialty?: string[];
  years_in_business?: number;
  pro_affiliations?: string[];
  publishing_admin?: string;
  master_admin?: string;
  emergency_contact_name?: string;
  emergency_contact_email?: string;
  emergency_contact_phone?: string;
  
  // Regular user fields
  first_name?: string;
  last_name?: string;
  business_name?: string;
  website?: string;
  bio?: string;
  profile_image_url?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;
  subscription_plan?: string;
  subscription_end_date?: string;
  producer_status?: string;
  producer_balance?: number;
  producer_payout_threshold?: number;
  producer_payout_email?: string;
  producer_payout_method?: string;
  producer_payout_schedule?: string;
  producer_payout_day?: number;
  producer_payout_month?: number;
  producer_payout_year?: number;
  producer_payout_frequency?: string;
  producer_payout_last_date?: string;
  producer_payout_next_date?: string;
  producer_payout_total?: number;
  producer_payout_pending?: number;
  producer_payout_processed?: number;
  producer_payout_failed?: number;
  producer_payout_cancelled?: number;
  producer_payout_refunded?: number;
  producer_payout_disputed?: number;
  producer_payout_chargeback?: number;
  producer_payout_other?: number;
  producer_payout_total_count?: number;
  producer_payout_pending_count?: number;
  producer_payout_processed_count?: number;
  producer_payout_failed_count?: number;
  producer_payout_cancelled_count?: number;
  producer_payout_refunded_count?: number;
  producer_payout_disputed_count?: number;
  producer_payout_chargeback_count?: number;
  producer_payout_other_count?: number;
  
  created_at: string;
  updated_at: string;
}

interface UnifiedAuthContextType {
  // User state
  user: User | null;
  loading: boolean;
  
  // Profile state (unified for all user types)
  profile: Profile | null;
  accountType: 'client' | 'producer' | 'admin' | 'white_label' | 'rights_holder' | null;
  membershipPlan: 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access' | null;
  needsPasswordSetup: boolean;
  
  // Authentication methods
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any; requiresEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  
  // Rights holder methods
  signUpRightsHolder: (email: string, password: string, rightsHolderData: Partial<Profile>) => Promise<{ error: any }>;
  updateRightsHolder: (data: Partial<Profile>) => Promise<{ error: any }>;
  
  // Regular user methods
  refreshMembership: () => Promise<void>;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Profile state (unified for all user types)
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accountType, setAccountType] = useState<'client' | 'producer' | 'admin' | 'white_label' | 'rights_holder' | null>(null);
  const [membershipPlan, setMembershipPlan] = useState<'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access' | null>(null);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  // Cache state to prevent unnecessary refetches
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isFetching, setIsFetching] = useState(false);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Fetch user profile (unified for all user types)
  const fetchProfile = async (userId: string, email: string) => {
    // Check cache first
    const cacheKey = CACHE_KEYS.PROFILE(userId);
    const cachedProfile = dataCache.get<Profile>(cacheKey);
    
    if (cachedProfile && !isFetching) {
      console.log('📦 Using cached profile data');
      setProfile(cachedProfile);
      setAccountType(cachedProfile.account_type);
      setMembershipPlan(cachedProfile.membership_plan);
      setNeedsPasswordSetup(cachedProfile.needs_password_setup);
      return;
    }

    if (isFetching) {
      console.log('⏳ Already fetching profile data, skipping...');
      return;
    }

    try {
      setIsFetching(true);
      console.log('🔄 Fetching profile for user:', userId);
      
      // Fetch profile from unified profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        setAccountType(null);
        setMembershipPlan(null);
        setNeedsPasswordSetup(false);
        return;
      }

      if (data) {
        console.log('✅ Profile data fetched successfully');
        setProfile(data);
        setAccountType(data.account_type);
        setMembershipPlan(data.membership_plan);
        setNeedsPasswordSetup(data.needs_password_setup);
        
        // Cache the profile data
        dataCache.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setAccountType(null);
      setMembershipPlan(null);
      setNeedsPasswordSetup(false);
    } finally {
      setIsFetching(false);
    }
  };



  // Unified session initialization
  const initializeSession = async () => {
    try {
      console.log('🔄 Initializing unified session...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('✅ Found existing session for user:', session.user.id);
        setUser(session.user);
        
        // Fetch profile first, then conditionally fetch rights holder data
        await fetchProfile(session.user.id, session.user.email || '');
        
        // Only fetch rights holder data if the user is a rights holder
        // We'll check this after the profile is fetched and account type is determined
             } else {
         console.log('❌ No existing session found');
         setUser(null);
         setProfile(null);
         setAccountType(null);
         setMembershipPlan(null);
         setNeedsPasswordSetup(false);
       }
         } catch (error) {
       console.error('❌ Error initializing session:', error);
       // Clear all state on error
       setUser(null);
       setProfile(null);
       setAccountType(null);
       setMembershipPlan(null);
       setNeedsPasswordSetup(false);
     } finally {
      setLoading(false);
      setIsInitialized(true);
      console.log('✅ Session initialization complete');
    }
  };

  // Regular user authentication methods
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Sign in error:', error);
      return { error };
    }
    if (data.user) {
      try {
        await fetchProfile(data.user.id, data.user.email || '');
      } catch (err) {
        console.error('Error fetching profile after sign in:', err);
        setAccountType('client');
        setNeedsPasswordSetup(false);
      }
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      throw new Error('An account with this email already exists');
    }

    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
    
    if (data.user && !data.user.email_confirmed_at) {
      return { error: null, requiresEmailConfirmation: true };
    }
    
    return { error: null, requiresEmailConfirmation: false };
  };

  // Rights holder authentication methods
  const signUpRightsHolder = async (email: string, password: string, rightsHolderData: Partial<Profile>) => {
    // Check if email already exists in profiles table
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      return { error: new Error('An account with this email already exists') };
    }

    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      console.error('Rights holder sign up error:', error);
      return { error };
    }

    if (data.user) {
      try {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            account_type: 'rights_holder',
            ...rightsHolderData,
          });

        if (insertError) {
          console.error('Error creating rights holder:', insertError);
          return { error: insertError };
        }

        // Send notification email to admin about new rights holder application
        try {
          const { error: emailError } = await supabase.functions.invoke('send-new-rights-holder-notification', {
            body: {
              rightsHolderEmail: email,
              rightsHolderName: rightsHolderData.company_name || rightsHolderData.legal_entity_name || 'Rights Holder',
              companyName: rightsHolderData.company_name,
              rightsHolderType: rightsHolderData.rights_holder_type,
              businessStructure: rightsHolderData.business_structure,
              phone: rightsHolderData.phone,
              address: [
                rightsHolderData.address_line_1,
                rightsHolderData.city,
                rightsHolderData.state,
                rightsHolderData.postal_code,
                rightsHolderData.country
              ].filter(Boolean).join(', ')
            }
          });

          if (emailError) {
            console.error('Error sending notification email:', emailError);
            // Don't return error here as the account was created successfully
          }
        } catch (emailErr) {
          console.error('Error calling notification email function:', emailErr);
          // Don't return error here as the account was created successfully
        }
      } catch (error) {
        console.error('Error creating rights holder:', error);
        return { error };
      }
    }

    return { error: null };
  };

  const updateRightsHolder = async (data: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) {
        return { error };
      }

      // Refresh profile data
      await fetchProfile(user.id, user.email || '');
      return { error: null };
    } catch (error) {
      console.error('Update rights holder error:', error);
      return { error };
    }
  };

  const refreshMembership = async () => {
    if (user) {
      await fetchProfile(user.id, user.email || '');
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Clear all state
      setUser(null);
      setProfile(null);
      setAccountType(null);
      setMembershipPlan(null);
      setNeedsPasswordSetup(false);
      console.log('✅ Sign out complete');
    }
  };

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (!isInitialized) {
      console.log('⏳ Skipping auth state change - not yet initialized');
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change event:', event, session?.user?.id);
        
        // Don't process auth state changes if we're already loading
        if (loading) {
          console.log('⏳ Skipping auth state change - already loading');
          return;
        }
        
        try {
          if (session?.user) {
            // Only update user if it's actually different
            if (user?.id !== session.user.id) {
              console.log('🔄 User changed, updating session');
              setUser(session.user);
              
                             // Fetch profile only - rights holder data will be handled in fetchProfile if needed
               await fetchProfile(session.user.id, session.user.email || '');
            } else {
              console.log('📦 Same user, skipping profile refetch');
            }
                     } else {
             console.log('❌ No session in auth state change');
             setUser(null);
             setProfile(null);
             setAccountType(null);
             setMembershipPlan(null);
             setNeedsPasswordSetup(false);
           }
                 } catch (error) {
           console.error('❌ Error in auth state change:', error);
           // Clear all state on error
           setUser(null);
           setProfile(null);
           setAccountType(null);
           setMembershipPlan(null);
           setNeedsPasswordSetup(false);
         }
        // Don't set loading to false here as it should only be set during initial load
      }
    );

    return () => subscription.unsubscribe();
  }, [isInitialized, loading, user?.id]);

  const value: UnifiedAuthContextType = {
    user,
    loading,
    profile,
    accountType,
    membershipPlan,
    needsPasswordSetup,
    signIn,
    signUp,
    signOut,
    signUpRightsHolder,
    updateRightsHolder,
    refreshMembership,
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
}

export function useUnifiedAuth() {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
}
