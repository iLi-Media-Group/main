import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { dataCache, CACHE_KEYS } from '../lib/cache';

interface RightsHolder {
  id: string;
  email: string;
  rights_holder_type: 'record_label' | 'publisher';
  company_name: string;
  legal_entity_name?: string;
  business_structure?: 'sole_proprietorship' | 'llc' | 'corporation' | 'partnership' | 'other';
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  is_active: boolean;
  terms_accepted: boolean;
  terms_accepted_at?: string;
  rights_authority_declaration_accepted: boolean;
  rights_authority_declaration_accepted_at?: string;
  created_at: string;
  updated_at: string;
}

interface RightsHolderProfile {
  id: string;
  rights_holder_id: string;
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
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  email: string;
  account_type: 'client' | 'producer' | 'admin' | 'white_label';
  membership_plan: 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access' | null;
  needs_password_setup: boolean;
  created_at: string;
  updated_at: string;
}

interface UnifiedAuthContextType {
  // User state
  user: User | null;
  loading: boolean;
  
  // Regular user state
  profile: Profile | null;
  accountType: 'client' | 'producer' | 'admin' | 'white_label' | null;
  membershipPlan: 'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access' | null;
  needsPasswordSetup: boolean;
  
  // Rights holder state
  rightsHolder: RightsHolder | null;
  rightsHolderProfile: RightsHolderProfile | null;
  
  // Authentication methods
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any; requiresEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  
  // Rights holder methods
  signUpRightsHolder: (email: string, password: string, rightsHolderData: Partial<RightsHolder>) => Promise<{ error: any }>;
  updateRightsHolder: (data: Partial<RightsHolder>) => Promise<{ error: any }>;
  updateRightsHolderProfile: (data: Partial<RightsHolderProfile>) => Promise<{ error: any }>;
  
  // Regular user methods
  refreshMembership: () => Promise<void>;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Regular user state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accountType, setAccountType] = useState<'client' | 'producer' | 'admin' | 'white_label' | null>(null);
  const [membershipPlan, setMembershipPlan] = useState<'Single Track' | 'Gold Access' | 'Platinum Access' | 'Ultimate Access' | null>(null);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  
  // Rights holder state
  const [rightsHolder, setRightsHolder] = useState<RightsHolder | null>(null);
  const [rightsHolderProfile, setRightsHolderProfile] = useState<RightsHolderProfile | null>(null);

  // Cache state to prevent unnecessary refetches
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isFetching, setIsFetching] = useState(false);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Fetch regular user profile
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
        
        // Try to fetch rights holder data for this user
        // If they exist in rights_holders table, they are a rights holder
        await fetchRightsHolder(userId);
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

  // Fetch rights holder data
  const fetchRightsHolder = async (userId: string) => {
    if (!userId) {
      setRightsHolder(null);
      setRightsHolderProfile(null);
      return;
    }

    // Validate session before fetching
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || session.user.id !== userId) {
        console.log('Session validation failed for rights holder fetch');
        setRightsHolder(null);
        setRightsHolderProfile(null);
        return;
      }
    } catch (error) {
      console.error('Error validating session for rights holder:', error);
      setRightsHolder(null);
      setRightsHolderProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rights_holders')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching rights holder:', error);
        setRightsHolder(null);
        return;
      }

      if (data) {
        setRightsHolder(data);
        
        // Fetch rights holder profile
        const { data: profileData, error: profileError } = await supabase
          .from('rights_holder_profiles')
          .select('*')
          .eq('rights_holder_id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching rights holder profile:', profileError);
        } else if (profileData) {
          setRightsHolderProfile(profileData);
        }
      }
    } catch (error) {
      console.error('Error fetching rights holder:', error);
      setRightsHolder(null);
      setRightsHolderProfile(null);
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
        setRightsHolder(null);
        setRightsHolderProfile(null);
      }
    } catch (error) {
      console.error('❌ Error initializing session:', error);
      // Clear all state on error
      setUser(null);
      setProfile(null);
      setAccountType(null);
      setMembershipPlan(null);
      setNeedsPasswordSetup(false);
      setRightsHolder(null);
      setRightsHolderProfile(null);
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
  const signUpRightsHolder = async (email: string, password: string, rightsHolderData: Partial<RightsHolder>) => {
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
          .from('rights_holders')
          .insert({
            id: data.user.id,
            email: data.user.email,
            ...rightsHolderData,
          });

        if (insertError) {
          console.error('Error creating rights holder:', insertError);
          return { error: insertError };
        }
      } catch (error) {
        console.error('Error creating rights holder:', error);
        return { error };
      }
    }

    return { error: null };
  };

  const updateRightsHolder = async (data: Partial<RightsHolder>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await supabase
        .from('rights_holders')
        .update(data)
        .eq('id', user.id);

      if (error) {
        return { error };
      }

      await fetchRightsHolder(user.id);
      return { error: null };
    } catch (error) {
      console.error('Update rights holder error:', error);
      return { error };
    }
  };

  const updateRightsHolderProfile = async (data: Partial<RightsHolderProfile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      if (rightsHolderProfile) {
        const { error } = await supabase
          .from('rights_holder_profiles')
          .update(data)
          .eq('id', rightsHolderProfile.id);

        if (error) {
          return { error };
        }
      } else {
        const { error } = await supabase
          .from('rights_holder_profiles')
          .insert({
            rights_holder_id: user.id,
            ...data,
          });

        if (error) {
          return { error };
        }
      }

      await fetchRightsHolder(user.id);
      return { error: null };
    } catch (error) {
      console.error('Update rights holder profile error:', error);
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
      setRightsHolder(null);
      setRightsHolderProfile(null);
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
            setRightsHolder(null);
            setRightsHolderProfile(null);
          }
        } catch (error) {
          console.error('❌ Error in auth state change:', error);
          // Clear all state on error
          setUser(null);
          setProfile(null);
          setAccountType(null);
          setMembershipPlan(null);
          setNeedsPasswordSetup(false);
          setRightsHolder(null);
          setRightsHolderProfile(null);
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
    rightsHolder,
    rightsHolderProfile,
    signIn,
    signUp,
    signOut,
    signUpRightsHolder,
    updateRightsHolder,
    updateRightsHolderProfile,
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
