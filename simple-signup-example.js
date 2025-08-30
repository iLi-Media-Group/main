// Simple Supabase Signup Example
// This shows exactly how to use the Supabase JS Client for the peppah.tracks@gmail.com signup

// Import the existing Supabase client from your app
import { supabase } from './src/lib/supabase.js';

// The exact signup code you requested:
async function signUpPeppah() {
  const { data, error } = await supabase.auth.signUp({
    email: 'peppah.tracks@gmail.com',
    password: 'Mbfpr123!'
  });

  if (error) {
    console.error('Signup error:', error.message);
    return { success: false, error };
  }

  if (data.user) {
    console.log('Signup successful!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    return { success: true, data };
  }

  return { success: false, error: 'No user data returned' };
}

// Usage in a React component:
function SignUpButton() {
  const handleSignUp = async () => {
    const result = await signUpPeppah();
    
    if (result.success) {
      console.log('✅ User signed up successfully!');
      // Handle successful signup (redirect, show success message, etc.)
    } else {
      console.error('❌ Signup failed:', result.error);
      // Handle error (show error message, etc.)
    }
  };

  return (
    <button onClick={handleSignUp}>
      Sign Up Peppah
    </button>
  );
}

// Export for use in other files
export { signUpPeppah, SignUpButton };
