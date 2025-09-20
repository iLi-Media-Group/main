// Supabase JS Client Signup Example
// This file demonstrates how to use the Supabase JS Client for user authentication

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (using the same configuration as your app)
const supabaseUrl = 'https://yciqkebqlajqbpwlujma.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
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

// Example 1: Basic signup with the provided credentials
async function signUpPeppah() {
  try {
    console.log('🔄 Starting signup process for peppah.tracks@gmail.com...');
    
    const { data, error } = await supabase.auth.signUp({
      email: 'peppah.tracks@gmail.com',
      password: 'Mbfpr123!'
    });

    if (error) {
      console.error('❌ Signup error:', error.message);
      return { success: false, error };
    }

    if (data.user) {
      console.log('✅ Signup successful!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      console.log('Email confirmed:', data.user.email_confirmed_at);
      console.log('Session:', data.session);
      
      return { success: true, data };
    } else {
      console.log('⚠️ Signup completed but no user data returned');
      return { success: false, error: 'No user data returned' };
    }
  } catch (error) {
    console.error('❌ Unexpected error during signup:', error);
    return { success: false, error };
  }
}

// Example 2: Signup with additional user metadata
async function signUpWithMetadata() {
  try {
    console.log('🔄 Starting signup with metadata...');
    
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
      console.error('❌ Signup error:', error.message);
      return { success: false, error };
    }

    console.log('✅ Signup with metadata successful!');
    console.log('User metadata:', data.user?.user_metadata);
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Unexpected error during signup:', error);
    return { success: false, error };
  }
}

// Example 3: Check if user already exists before signup
async function checkAndSignUp() {
  try {
    console.log('🔍 Checking if user already exists...');
    
    // First, try to sign in to see if the user exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'peppah.tracks@gmail.com',
      password: 'Mbfpr123!'
    });

    if (signInData.user) {
      console.log('✅ User already exists and credentials are valid');
      await supabase.auth.signOut(); // Sign out after checking
      return { success: true, message: 'User already exists', data: signInData };
    }

    // If sign in fails, try to sign up
    console.log('🔄 User does not exist, proceeding with signup...');
    return await signUpPeppah();
    
  } catch (error) {
    console.error('❌ Error checking user existence:', error);
    return { success: false, error };
  }
}

// Example 4: React component usage example
export function useSignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const signUp = async (email, password, metadata = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        setError(error.message);
        return { success: false, error };
      }

      if (data.user) {
        setUser(data.user);
        return { success: true, data };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return { signUp, loading, error, user };
}

// Export the functions for use in other files
export { signUpPeppah, signUpWithMetadata, checkAndSignUp, supabase };

// Example usage in a React component:
/*
import { useSignUp } from './supabase-signup-example.js';

function SignUpComponent() {
  const { signUp, loading, error, user } = useSignUp();

  const handleSignUp = async () => {
    const result = await signUp('peppah.tracks@gmail.com', 'Mbfpr123!', {
      account_type: 'producer'
    });
    
    if (result.success) {
      console.log('Signup successful!');
    } else {
      console.error('Signup failed:', result.error);
    }
  };

  return (
    <div>
      <button onClick={handleSignUp} disabled={loading}>
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {user && <p>Welcome, {user.email}!</p>}
    </div>
  );
}
*/

// Run the example if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('🌐 Supabase signup examples loaded in browser');
  console.log('Run signUpPeppah() to test the basic signup');
  console.log('Run signUpWithMetadata() to test signup with metadata');
  console.log('Run checkAndSignUp() to check if user exists first');
} else {
  // Node.js environment
  console.log('🖥️ Supabase signup examples loaded in Node.js');
}
