// Test script to verify database connection and table existence
// Run this in the browser console to test the rights holders system

import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://yciqkebqlajqbpwlujma.supabase.co';
const supabaseKey = 'your-anon-key'; // Replace with actual key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Test 1: Check if rights_holders table exists
    console.log('Test 1: Checking if rights_holders table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('rights_holders')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('❌ rights_holders table error:', tableError);
      if (tableError.code === '42P01') {
        console.error('Table does not exist. Run the database migration.');
      } else if (tableError.code === '42501') {
        console.error('Permission denied. Check RLS policies.');
      }
    } else {
      console.log('✅ rights_holders table exists and is accessible');
    }
    
    // Test 2: Check if rights_holder_profiles table exists
    console.log('Test 2: Checking if rights_holder_profiles table exists...');
    const { data: profileCheck, error: profileError } = await supabase
      .from('rights_holder_profiles')
      .select('count')
      .limit(1);
    
    if (profileError) {
      console.error('❌ rights_holder_profiles table error:', profileError);
      if (profileError.code === '42P01') {
        console.error('Table does not exist. Run the database migration.');
      } else if (profileError.code === '42501') {
        console.error('Permission denied. Check RLS policies.');
      }
    } else {
      console.log('✅ rights_holder_profiles table exists and is accessible');
    }
    
    // Test 3: Check RLS policies
    console.log('Test 3: Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_rls_policies', { table_name: 'rights_holders' });
    
    if (policiesError) {
      console.log('ℹ️ Could not check RLS policies (this is normal for non-admin users)');
    } else {
      console.log('✅ RLS policies are configured');
    }
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  }
}

// Run the test
testDatabaseConnection();
