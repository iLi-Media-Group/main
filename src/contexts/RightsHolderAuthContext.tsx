import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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

interface RightsHolderAuthContextType {
  user: User | null;
  rightsHolder: RightsHolder | null;
  rightsHolderProfile: RightsHolderProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, rightsHolderData: Partial<RightsHolder>) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateRightsHolder: (data: Partial<RightsHolder>) => Promise<{ error: any }>;
  updateRightsHolderProfile: (data: Partial<RightsHolderProfile>) => Promise<{ error: any }>;
  refreshRightsHolder: () => Promise<void>;
}

const RightsHolderAuthContext = createContext<RightsHolderAuthContextType | undefined>(undefined);

export function RightsHolderAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [rightsHolder, setRightsHolder] = useState<RightsHolder | null>(null);
  const [rightsHolderProfile, setRightsHolderProfile] = useState<RightsHolderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRightsHolder = async (userId: string) => {
    // Don't fetch if userId is null or empty
    if (!userId) {
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
        
        // If it's a table not found error, log it but don't throw
        if (error.code === '42P01') {
          console.error('Rights holders table not found. Please run the database migration.');
          setRightsHolder(null);
          return;
        }
        
        // If it's a permission error, log it but don't throw
        if (error.code === '42501') {
          console.error('Permission denied accessing rights holders table.');
          setRightsHolder(null);
          return;
        }
        
        setRightsHolder(null);
        return;
      }

      if (data) {
        setRightsHolder(data as RightsHolder);
        
        // Fetch profile if it exists
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('rights_holder_profiles')
            .select('*')
            .eq('rights_holder_id', userId)
            .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully

          if (profileError) {
            console.error('Error fetching rights holder profile:', profileError);
            // If it's a table not found error, log it but don't throw
            if (profileError.code === '42P01') {
              console.error('Rights holder profiles table not found. Please run the database migration.');
            }
            // If it's a permission error, log it but don't throw
            if (profileError.code === '42501') {
              console.error('Permission denied accessing rights holder profiles table.');
            }
            setRightsHolderProfile(null);
          } else if (profileData) {
            setRightsHolderProfile(profileData as RightsHolderProfile);
          } else {
            setRightsHolderProfile(null);
          }
        } catch (error) {
          console.error('Error in profile fetch:', error);
          setRightsHolderProfile(null);
        }
      } else {
        setRightsHolder(null);
        setRightsHolderProfile(null);
      }
    } catch (error) {
      console.error('Error in fetchRightsHolder:', error);
      setRightsHolder(null);
      setRightsHolderProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        await fetchRightsHolder(data.user.id);
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, rightsHolderData: Partial<RightsHolder>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Auth signup error:', error);
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        
        // Create rights holder record
        const { error: rightsHolderError } = await supabase
          .from('rights_holders')
          .insert({
            id: data.user.id,
            email,
            ...rightsHolderData,
          });

        if (rightsHolderError) {
          console.error('Error creating rights holder:', rightsHolderError);
          
          // If it's a table not found error, provide a helpful message
          if (rightsHolderError.code === '42P01') {
            return { 
              error: new Error('Database tables not found. Please contact support to set up the rights holders system.') 
            };
          }
          
          // If it's a permission error, provide a helpful message
          if (rightsHolderError.code === '42501') {
            return { 
              error: new Error('Permission denied. Please contact support to configure database permissions.') 
            };
          }
          
          return { error: rightsHolderError };
        }

        // Only fetch rights holder if creation was successful
        await fetchRightsHolder(data.user.id);
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      } else {
        setUser(null);
        setRightsHolder(null);
        setRightsHolderProfile(null);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
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
        // Update existing profile
        const { error } = await supabase
          .from('rights_holder_profiles')
          .update(data)
          .eq('id', rightsHolderProfile.id);

        if (error) {
          return { error };
        }
      } else {
        // Create new profile
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

  const refreshRightsHolder = async () => {
    if (user) {
      await fetchRightsHolder(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 10000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (session?.user) {
          setUser(session.user);
          await fetchRightsHolder(session.user.id);
        } else {
          setUser(null);
          setRightsHolder(null);
          setRightsHolderProfile(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        // If there's an error with the session, clear it automatically
        await supabase.auth.signOut();
        setUser(null);
        setRightsHolder(null);
        setRightsHolderProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            setUser(session.user);
            await fetchRightsHolder(session.user.id);
            setLoading(false);
          } else {
            setUser(null);
            setRightsHolder(null);
            setRightsHolderProfile(null);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          // If there's an error, clear the session automatically
          await supabase.auth.signOut();
          setUser(null);
          setRightsHolder(null);
          setRightsHolderProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value: RightsHolderAuthContextType = {
    user,
    rightsHolder,
    rightsHolderProfile,
    loading,
    signIn,
    signUp,
    signOut,
    updateRightsHolder,
    updateRightsHolderProfile,
    refreshRightsHolder,
  };

  return (
    <RightsHolderAuthContext.Provider value={value}>
      {children}
    </RightsHolderAuthContext.Provider>
  );
}

export function useRightsHolderAuth() {
  const context = useContext(RightsHolderAuthContext);
  if (context === undefined) {
    throw new Error('useRightsHolderAuth must be used within a RightsHolderAuthProvider');
  }
  return context;
}
