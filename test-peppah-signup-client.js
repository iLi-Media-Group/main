// Test Peppah Signup using Supabase JS Client
// This approach should handle all triggers and constraints properly

// First, let's check if we can access the supabase client
console.log('Testing Supabase JS Client approach...');

// Test function to create peppah user via JS Client
async function createPeppahUser() {
  try {
    console.log('🚀 Attempting to create peppah user via Supabase JS Client...');
    
    // First, let's check if the user already exists
    const { data: existingUser, error: checkError } = await supabase.auth.admin.getUserByEmail('peppah.tracks@gmail.com');
    
    if (existingUser?.user) {
      console.log('⚠️ User already exists:', existingUser.user.id);
      return { success: false, message: 'User already exists', user: existingUser.user };
    }
    
    // Create the user via admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'peppah.tracks@gmail.com',
      password: 'Mbfpr123!',
      email_confirm: true,
      user_metadata: {
        account_type: 'producer'
      }
    });
    
    if (error) {
      console.error('❌ Error creating user:', error);
      return { success: false, error };
    }
    
    console.log('✅ User created successfully:', data.user.id);
    
    // Now let's check if the profile was created automatically
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      console.log('⚠️ No profile found, creating one manually...');
      
      // Create profile manually
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: 'peppah.tracks@gmail.com',
          account_type: 'producer'
        })
        .select()
        .single();
      
      if (createProfileError) {
        console.error('❌ Error creating profile:', createProfileError);
        return { success: false, error: createProfileError };
      }
      
      console.log('✅ Profile created manually:', newProfile);
    } else {
      console.log('✅ Profile exists:', profile);
    }
    
    return { success: true, user: data.user, profile };
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { success: false, error };
  }
}

// Test function to sign in as peppah
async function testPeppahSignIn() {
  try {
    console.log('🔐 Testing peppah sign in...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'peppah.tracks@gmail.com',
      password: 'Mbfpr123!'
    });
    
    if (error) {
      console.error('❌ Sign in error:', error);
      return { success: false, error };
    }
    
    console.log('✅ Sign in successful:', data.user.id);
    
    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log('✅ Profile found:', profile);
    }
    
    return { success: true, user: data.user, profile };
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { success: false, error };
  }
}

// Test function for new producer signup
async function testNewProducerSignup() {
  try {
    console.log('🚀 Testing new producer signup...');
    
    const testEmail = `test-producer-${Date.now()}@example.com`;
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          account_type: 'producer'
        }
      }
    });
    
    if (error) {
      console.error('❌ New producer signup error:', error);
      return { success: false, error };
    }
    
    console.log('✅ New producer signup successful:', data.user?.id);
    return { success: true, user: data.user };
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { success: false, error };
  }
}

// Run the tests
async function runTests() {
  console.log('🧪 Starting peppah user tests...\n');
  
  // Test 1: Create peppah user
  console.log('=== TEST 1: Create Peppah User ===');
  const createResult = await createPeppahUser();
  console.log('Result:', createResult);
  console.log('');
  
  // Test 2: Sign in as peppah
  console.log('=== TEST 2: Sign In as Peppah ===');
  const signInResult = await testPeppahSignIn();
  console.log('Result:', signInResult);
  console.log('');
  
  // Test 3: New producer signup
  console.log('=== TEST 3: New Producer Signup ===');
  const newSignupResult = await testNewProducerSignup();
  console.log('Result:', newSignupResult);
  console.log('');
  
  console.log('🏁 All tests completed!');
}

// Export functions for manual testing
window.createPeppahUser = createPeppahUser;
window.testPeppahSignIn = testPeppahSignIn;
window.testNewProducerSignup = testNewProducerSignup;
window.runTests = runTests;

console.log('✅ Test functions loaded. Run runTests() to execute all tests.');
console.log('Or run individual functions: createPeppahUser(), testPeppahSignIn(), testNewProducerSignup()');
