// Test Peppah Signup using existing Supabase client on the page
// This script finds the existing Supabase client and uses it

console.log('🔍 Looking for existing Supabase client...');

// Function to find the Supabase client
function findSupabaseClient() {
  // Try different ways to find the supabase client
  if (window.supabase) {
    console.log('✅ Found supabase client at window.supabase');
    return window.supabase;
  }
  
  // Check if it's in a module or different variable name
  const possibleNames = [
    'supabase',
    'supabaseClient', 
    'client',
    'db',
    'database'
  ];
  
  for (const name of possibleNames) {
    if (window[name] && window[name].auth) {
      console.log(`✅ Found supabase client at window.${name}`);
      return window[name];
    }
  }
  
  // Check if it's in a React component or other context
  if (window.__SUPABASE__) {
    console.log('✅ Found supabase client at window.__SUPABASE__');
    return window.__SUPABASE__;
  }
  
  // Try to find it in the global scope
  for (const key in window) {
    try {
      const obj = window[key];
      if (obj && typeof obj === 'object' && obj.auth && obj.auth.signUp) {
        console.log(`✅ Found supabase client at window.${key}`);
        return obj;
      }
    } catch (e) {
      // Ignore errors when checking objects
    }
  }
  
  console.error('❌ Could not find Supabase client');
  return null;
}

// Get the supabase client
const supabase = findSupabaseClient();

if (!supabase) {
  console.error('❌ No Supabase client found. Make sure you are on the mybeatfi.io website.');
  console.log('💡 Try running this on the mybeatfi.io website where Supabase is loaded.');
} else {
  console.log('✅ Supabase client found and ready to use!');
}

// Test function to create peppah user via regular signup (not admin)
async function createPeppahUser() {
  if (!supabase) {
    return { success: false, error: 'No Supabase client found' };
  }
  
  try {
    console.log('🚀 Attempting to create peppah user via regular signup...');
    
    // Use regular signup instead of admin API
    const { data, error } = await supabase.auth.signUp({
      email: 'peppah.tracks@gmail.com',
      password: 'Mbfpr123!',
      options: {
        data: {
          account_type: 'producer'
        }
      }
    });
    
    if (error) {
      console.error('❌ Error creating user:', error);
      return { success: false, error };
    }
    
    console.log('✅ User created successfully:', data.user?.id);
    console.log('✅ Session:', data.session ? 'Created' : 'Not created');
    
    // Check if profile was created automatically
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.log('⚠️ No profile found yet:', profileError.message);
      } else {
        console.log('✅ Profile exists:', profile);
      }
    }
    
    return { success: true, user: data.user, session: data.session };
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { success: false, error };
  }
}

// Test function to sign in as peppah
async function testPeppahSignIn() {
  if (!supabase) {
    return { success: false, error: 'No Supabase client found' };
  }
  
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
  if (!supabase) {
    return { success: false, error: 'No Supabase client found' };
  }
  
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

// Simple test to check if supabase is working
async function testSupabaseConnection() {
  if (!supabase) {
    return { success: false, error: 'No Supabase client found' };
  }
  
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Try to get current user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('ℹ️ No current user (expected):', error.message);
    } else {
      console.log('✅ Current user found:', user.id);
    }
    
    // Try to query profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError);
      return { success: false, error: profilesError };
    }
    
    console.log('✅ Supabase connection working!');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Connection test error:', error);
    return { success: false, error };
  }
}

// Run the tests
async function runTests() {
  console.log('🧪 Starting peppah user tests...\n');
  
  // Test 0: Check Supabase connection
  console.log('=== TEST 0: Check Supabase Connection ===');
  const connectionResult = await testSupabaseConnection();
  console.log('Result:', connectionResult);
  console.log('');
  
  if (!connectionResult.success) {
    console.log('❌ Stopping tests due to connection issues');
    return;
  }
  
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
window.testSupabaseConnection = testSupabaseConnection;
window.runTests = runTests;

console.log('✅ Test functions loaded. Run runTests() to execute all tests.');
console.log('Or run individual functions: createPeppahUser(), testPeppahSignIn(), testNewProducerSignup()');
