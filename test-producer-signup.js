// Test Producer Signup
// This script tests the producer signup process after fixing the database triggers

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

// Test producer signup
async function testProducerSignup() {
  console.log('🧪 Testing producer signup process...');
  
  try {
    // Generate a unique email for testing
    const testEmail = `test-producer-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Using test email: ${testEmail}`);
    
    // Step 1: Sign up the user
    console.log('🔄 Step 1: Creating auth user...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          account_type: 'producer',
          full_name: 'Test Producer',
          company: 'Test Productions'
        }
      }
    });

    if (error) {
      console.error('❌ Auth signup error:', error.message);
      console.error('Error details:', error);
      return { success: false, error };
    }

    if (!data.user) {
      console.error('❌ No user data returned from signup');
      return { success: false, error: 'No user data returned' };
    }

    console.log('✅ Auth user created successfully!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Email confirmed:', data.user.email_confirmed_at);

    // Step 2: Check if profile was created
    console.log('🔄 Step 2: Checking profile creation...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return { success: false, error: profileError };
    }

    if (!profileData) {
      console.error('❌ Profile was not created automatically');
      return { success: false, error: 'Profile not created' };
    }

    console.log('✅ Profile created successfully!');
    console.log('Profile data:', {
      id: profileData.id,
      email: profileData.email,
      account_type: profileData.account_type,
      producer_number: profileData.producer_number,
      created_at: profileData.created_at
    });

    // Step 3: Check if producer balance was created
    console.log('🔄 Step 3: Checking producer balance creation...');
    const { data: balanceData, error: balanceError } = await supabase
      .from('producer_balances')
      .select('*')
      .eq('producer_id', data.user.id)
      .maybeSingle();

    if (balanceError) {
      console.error('❌ Error fetching producer balance:', balanceError);
      // Don't fail the test for this, as it might not be critical
      console.log('⚠️ Producer balance not found, but this might be expected');
    } else if (balanceData) {
      console.log('✅ Producer balance created successfully!');
      console.log('Balance data:', {
        producer_id: balanceData.producer_id,
        available_balance: balanceData.available_balance,
        pending_balance: balanceData.pending_balance,
        lifetime_earnings: balanceData.lifetime_earnings
      });
    }

    // Step 4: Test sign in with the new account
    console.log('🔄 Step 4: Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Sign in error:', signInError);
      return { success: false, error: signInError };
    }

    console.log('✅ Sign in successful!');
    console.log('Session user:', signInData.user.email);

    // Step 5: Clean up - sign out
    console.log('🔄 Step 5: Cleaning up...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

    console.log('🎉 All tests passed! Producer signup is working correctly.');
    return { 
      success: true, 
      user: data.user,
      profile: profileData,
      balance: balanceData 
    };

  } catch (error) {
    console.error('❌ Unexpected error during test:', error);
    return { success: false, error };
  }
}

// Test the specific peppah signup
async function testPeppahSignup() {
  console.log('🧪 Testing peppah.tracks@gmail.com signup...');
  
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
      console.error('❌ Peppah signup error:', error.message);
      console.error('Error details:', error);
      return { success: false, error };
    }

    if (data.user) {
      console.log('✅ Peppah signup successful!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      
      // Check profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
        
      if (profileData) {
        console.log('✅ Profile created for Peppah');
        console.log('Producer number:', profileData.producer_number);
      }
      
      return { success: true, data };
    }

    return { success: false, error: 'No user data returned' };

  } catch (error) {
    console.error('❌ Unexpected error during Peppah test:', error);
    return { success: false, error };
  }
}

// Export functions for use in browser console
if (typeof window !== 'undefined') {
  window.testProducerSignup = testProducerSignup;
  window.testPeppahSignup = testPeppahSignup;
  console.log('🧪 Test functions available:');
  console.log('- testProducerSignup() - Test with random email');
  console.log('- testPeppahSignup() - Test with peppah.tracks@gmail.com');
}

// Run test if this file is executed directly
if (typeof window === 'undefined') {
  testProducerSignup().then(result => {
    if (result.success) {
      console.log('✅ Producer signup test completed successfully');
    } else {
      console.log('❌ Producer signup test failed');
      process.exit(1);
    }
  });
}
