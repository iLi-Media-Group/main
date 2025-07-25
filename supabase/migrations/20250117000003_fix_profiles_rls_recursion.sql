-- Migration: Fix infinite recursion in profiles table RLS policies
-- The issue is that the INSERT policy is trying to check the profiles table while inserting into it

-- Drop the problematic admin insert policy
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Create a new admin insert policy that doesn't cause recursion
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    -- Allow admins to insert profiles by checking their email directly
    (auth.jwt() ->> 'email') IN (
      'knockriobeats@gmail.com',
      'info@mybeatfi.io', 
      'derykbanks@yahoo.com',
      'knockriobeats2@gmail.com'
    )
  );

-- Also create a policy for users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
  );

-- Ensure the basic policies exist
CREATE POLICY IF NOT EXISTS "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Drop the problematic admin delete policy if it exists
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create a new admin delete policy
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (
    (auth.jwt() ->> 'email') IN (
      'knockriobeats@gmail.com',
      'info@mybeatfi.io',
      'derykbanks@yahoo.com', 
      'knockriobeats2@gmail.com'
    )
  ); 