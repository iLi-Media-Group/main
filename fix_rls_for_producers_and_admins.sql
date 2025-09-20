-- Fix RLS Policies for Producers and Admin/Producers
-- Allow both 'producer' and 'admin,producer' account types to upload tracks

-- First, let's see what account types exist
SELECT DISTINCT account_type FROM profiles WHERE account_type IS NOT NULL;

-- Check current user's profile
SELECT 
  id,
  email,
  account_type,
  first_name,
  last_name
FROM profiles 
WHERE id = auth.uid();

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Producers can insert own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can update own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can delete own tracks" ON tracks;
DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;
DROP POLICY IF EXISTS "Public read access to tracks" ON tracks;
DROP POLICY IF EXISTS "Admins can manage all tracks" ON tracks;

-- Create comprehensive policies that work for both producers and admin/producers
-- INSERT: Allow producers and admin/producers to insert tracks
CREATE POLICY "Producers can insert own tracks" ON tracks
  FOR INSERT
  WITH CHECK (
    auth.uid() = track_producer_id
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (
        account_type = 'producer' 
        OR account_type = 'admin,producer'
        OR account_type = 'admin'
      )
    )
  );

-- SELECT: Allow everyone to view tracks (for catalog browsing)
CREATE POLICY "Tracks are viewable by everyone" ON tracks
  FOR SELECT
  USING (true);

-- UPDATE: Allow track owners who are producers or admin/producers
CREATE POLICY "Producers can update own tracks" ON tracks
  FOR UPDATE
  USING (
    auth.uid() = track_producer_id
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (
        account_type = 'producer' 
        OR account_type = 'admin,producer'
        OR account_type = 'admin'
      )
    )
  );

-- DELETE: Allow track owners who are producers or admin/producers
CREATE POLICY "Producers can delete own tracks" ON tracks
  FOR DELETE
  USING (
    auth.uid() = track_producer_id
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (
        account_type = 'producer' 
        OR account_type = 'admin,producer'
        OR account_type = 'admin'
      )
    )
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

-- Test if the current user can insert tracks
SELECT 
  'Current user can insert tracks' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type IN ('producer', 'admin,producer', 'admin')
    ) THEN 'YES - User is producer/admin'
    ELSE 'NO - User is not producer/admin'
  END as result; 