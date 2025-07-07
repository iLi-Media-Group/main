-- Migration: Fix profiles table RLS policies and add admin insert permissions
-- This allows admins to create white label client profiles

-- Add admin insert policy for profiles
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- Add admin delete policy for profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- Ensure the account_type constraint includes 'white_label'
-- First, drop the existing check constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;

-- Add the new check constraint that includes 'white_label'
ALTER TABLE profiles ADD CONSTRAINT profiles_account_type_check 
CHECK (account_type IN ('client', 'producer', 'admin', 'white_label'));

-- Add comment to document the account types
COMMENT ON COLUMN profiles.account_type IS 'Type of account: client, producer, admin, or white_label'; 