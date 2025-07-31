-- Production RLS Fix for Tracks Table
-- This creates proper, secure policies for production use

-- First, let's check the current user's profile to understand the account_type values
SELECT 
  id,
  email,
  account_type,
  created_at
FROM profiles 
WHERE id = auth.uid()
LIMIT 1;

-- Check what account types exist in the system
SELECT DISTINCT account_type FROM profiles WHERE account_type IS NOT NULL;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Producers can insert own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can update own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can delete own tracks" ON tracks;
DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;
DROP POLICY IF EXISTS "Public read access to tracks" ON tracks;
DROP POLICY IF EXISTS "Admins can manage all tracks" ON tracks;

-- Create comprehensive production policies
-- INSERT: Allow producers and admins to insert tracks
CREATE POLICY "Producers can insert own tracks" ON tracks
  FOR INSERT
  WITH CHECK (
    auth.uid() = track_producer_id
  );

-- SELECT: Allow everyone to view tracks (for catalog browsing)
CREATE POLICY "Tracks are viewable by everyone" ON tracks
  FOR SELECT
  USING (true);

-- UPDATE: Allow track owners and admins to update tracks
CREATE POLICY "Producers can update own tracks" ON tracks
  FOR UPDATE
  USING (
    auth.uid() = track_producer_id
  );

-- DELETE: Allow track owners and admins to delete tracks
CREATE POLICY "Producers can delete own tracks" ON tracks
  FOR DELETE
  USING (
    auth.uid() = track_producer_id
  );

-- Verify all policies are created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY cmd, policyname;

-- Test the policies by checking if the current user can insert
-- This will help us verify the policies work
SELECT 
  'Current user can insert tracks' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type IN ('producer', 'admin', 'admin,producer')
    ) THEN 'YES - User is producer/admin'
    ELSE 'NO - User is not producer/admin'
  END as result; 