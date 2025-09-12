// Test Peppah Sign In
// This script tests if the peppah.tracks@gmail.com user can sign in after the fix

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://yciqkebqlajqbpwlujma.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('❌ Missing VITE_SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'mybeatfi-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'mybeatfi-web'
    }
  }
});

// Test peppah sign in
async function testPeppahSignIn() {
  console.log('🧪 Testing peppah.tracks@gmail.com sign in...');
  
  try {
    // Step 1: Try to sign in with peppah credentials
    console.log('🔄 Step 1: Attempting sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'peppah.tracks@gmail.com',
      password: 'Mbfpr123!'
    });

    if (error) {
      console.error('❌ Sign in error:', error.message);
      console.error('Error details:', error);
      return { success: false, error };
    }

    if (!data.user) {
      console.error('❌ No user data returned from sign in');
      return { success: false, error: 'No user data returned' };
    }

    console.log('✅ Sign in successful!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Email confirmed:', data.user.email_confirmed_at);
    console.log('User metadata:', data.user.user_metadata);

    // Step 2: Check if profile exists
    console.log('🔄 Step 2: Checking profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return { success: false, error: profileError };
    }

    if (profileData) {
      console.log('✅ Profile found!');
      console.log('Profile data:', {
        id: profileData.id,
        email: profileData.email,
        account_type: profileData.account_type,
        producer_number: profileData.producer_number,
        created_at: profileData.created_at
      });
    } else {
      console.log('⚠️ No profile found for user');
    }

    // Step 3: Check producer balance if it's a producer
    if (profileData && profileData.account_type === 'producer') {
      console.log('🔄 Step 3: Checking producer balance...');
      const { data: balanceData, error: balanceError } = await supabase
        .from('producer_balances')
        .select('*')
        .eq('producer_id', data.user.id)
        .maybeSingle();

      if (balanceError) {
        console.error('❌ Error fetching producer balance:', balanceError);
      } else if (balanceData) {
        console.log('✅ Producer balance found!');
        console.log('Balance data:', {
          producer_id: balanceData.producer_id,
          available_balance: balanceData.available_balance,
          pending_balance: balanceData.pending_balance,
          lifetime_earnings: balanceData.lifetime_earnings
        });
      } else {
        console.log('⚠️ No producer balance found');
      }
    }

    // Step 4: Clean up - sign out
    console.log('🔄 Step 4: Cleaning up...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

    console.log('🎉 Peppah sign in test passed!');
    return { 
      success: true, 
      user: data.user,
      profile: profileData
    };

  } catch (error) {
    console.error('❌ Unexpected error during peppah sign in test:', error);
    return { success: false, error };
  }
}

// Test peppah signup (this should now work)
async function testPeppahSignUp() {
  console.log('🧪 Testing peppah.tracks@gmail.com signup (should fail if user exists)...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'peppah.tracks@gmail.com',
      password: 'Mbfpr123!',
      options: {
        data: {
          account_type: 'producer',
          full_name: 'Peppah Tracks',
          company: 'Peppah Productions'
        }
      }
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        console.log('✅ Signup correctly failed - user already exists');
        return { success: true, error: null, message: 'User already exists' };
      } else {
        console.error('❌ Unexpected signup error:', error.message);
        return { success: false, error };
      }
    }

    if (data.user) {
      console.log('✅ Signup successful!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      return { success: true, data };
    }

    return { success: false, error: 'No user data returned' };

  } catch (error) {
    console.error('❌ Unexpected error during peppah signup test:', error);
    return { success: false, error };
  }
}

// Export functions for use in browser console
if (typeof window !== 'undefined') {
  window.testPeppahSignIn = testPeppahSignIn;
  window.testPeppahSignUp = testPeppahSignUp;
  console.log('🧪 Test functions available:');
  console.log('- testPeppahSignIn() - Test peppah sign in');
  console.log('- testPeppahSignUp() - Test peppah signup (should fail if user exists)');
}

// Run test if this file is executed directly
if (typeof window === 'undefined') {
  console.log('🧪 Running peppah tests...');
  
  testPeppahSignIn().then(result => {
    if (result.success) {
      console.log('✅ Peppah sign in test completed successfully');
    } else {
      console.log('❌ Peppah sign in test failed');
    }
    
    // Now test signup
    return testPeppahSignUp();
  }).then(result => {
    if (result.success) {
      console.log('✅ Peppah signup test completed successfully');
    } else {
      console.log('❌ Peppah signup test failed');
    }
  });
}
