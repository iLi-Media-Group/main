// Test Basic Auth Signup (No Profile Creation)
// This tests if the basic Supabase auth signup works without any database triggers

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

// Test basic auth signup without any metadata
async function testBasicAuthSignup() {
  console.log('🧪 Testing basic auth signup (no profile creation)...');
  
  try {
    // Generate a unique email for testing
    const testEmail = `test-basic-auth-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Using test email: ${testEmail}`);
    
    // Step 1: Basic signup with no metadata
    console.log('🔄 Step 1: Creating auth user (no metadata)...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
      // No options, no metadata
    });

    if (error) {
      console.error('❌ Basic auth signup error:', error.message);
      console.error('Error details:', error);
      return { success: false, error };
    }

    if (!data.user) {
      console.error('❌ No user data returned from basic signup');
      return { success: false, error: 'No user data returned' };
    }

    console.log('✅ Basic auth user created successfully!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Email confirmed:', data.user.email_confirmed_at);
    console.log('User metadata:', data.user.user_metadata);

    // Step 2: Check if any profile was created automatically
    console.log('🔄 Step 2: Checking if profile was created automatically...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
    } else if (profileData) {
      console.log('⚠️ Profile was created automatically (this might be expected)');
      console.log('Profile data:', {
        id: profileData.id,
        email: profileData.email,
        account_type: profileData.account_type,
        created_at: profileData.created_at
      });
    } else {
      console.log('✅ No profile was created automatically (this is expected for basic signup)');
    }

    // Step 3: Test sign in with the new account
    console.log('🔄 Step 3: Testing sign in...');
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

    // Step 4: Clean up - sign out
    console.log('🔄 Step 4: Cleaning up...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

    console.log('🎉 Basic auth signup test passed!');
    return { 
      success: true, 
      user: data.user,
      profile: profileData
    };

  } catch (error) {
    console.error('❌ Unexpected error during basic auth test:', error);
    return { success: false, error };
  }
}

// Test producer signup with metadata (this is what's failing)
async function testProducerSignupWithMetadata() {
  console.log('🧪 Testing producer signup with metadata (this should fail)...');
  
  try {
    const testEmail = `test-producer-metadata-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Using test email: ${testEmail}`);
    
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
      console.error('❌ Producer signup with metadata failed (expected):', error.message);
      console.error('Error details:', error);
      return { success: false, error, expected: true };
    }

    if (data.user) {
      console.log('✅ Producer signup with metadata succeeded (unexpected)!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      console.log('User metadata:', data.user.user_metadata);
      
      // Check profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
        
      if (profileData) {
        console.log('✅ Profile created for producer');
        console.log('Producer number:', profileData.producer_number);
      }
      
      return { success: true, data, expected: false };
    }

    return { success: false, error: 'No user data returned', expected: true };

  } catch (error) {
    console.error('❌ Unexpected error during producer metadata test:', error);
    return { success: false, error, expected: true };
  }
}

// Export functions for use in browser console
if (typeof window !== 'undefined') {
  window.testBasicAuthSignup = testBasicAuthSignup;
  window.testProducerSignupWithMetadata = testProducerSignupWithMetadata;
  console.log('🧪 Test functions available:');
  console.log('- testBasicAuthSignup() - Test basic auth without metadata');
  console.log('- testProducerSignupWithMetadata() - Test producer signup with metadata');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  console.log('🧪 Running auth signup tests...');
  
  testBasicAuthSignup().then(result => {
    if (result.success) {
      console.log('✅ Basic auth signup test completed successfully');
    } else {
      console.log('❌ Basic auth signup test failed');
    }
    
    // Now test producer signup
    return testProducerSignupWithMetadata();
  }).then(result => {
    if (result.expected && !result.success) {
      console.log('✅ Producer signup test failed as expected (this is good)');
    } else if (result.success && !result.expected) {
      console.log('❌ Producer signup test succeeded unexpectedly');
    } else {
      console.log('❌ Producer signup test had unexpected result');
    }
  });
}
