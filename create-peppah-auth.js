import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://yciqkebqlajqbpwlujma.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPeppahAuth() {
  try {
    console.log('Creating authentication for peppah.tracks@gmail.com...');
    
    const { data, error } = await supabase.functions.invoke('create-user-auth', {
      body: {
        email: 'peppah.tracks@gmail.com',
        password: 'Peppah2024!', // You can change this password
        accountType: 'client' // or 'producer', 'artist', etc. based on what type of account you want
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      return;
    }

    console.log('Success! User created:', data);
    console.log('Email: peppah.tracks@gmail.com');
    console.log('Password: Peppah2024!');
    console.log('Account Type:', data.user.account_type);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createPeppahAuth();
