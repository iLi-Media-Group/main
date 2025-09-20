-- Fix the INSERT policy for tracks table - Version 2
-- The current policy still has a null qualifier, let's fix this properly

-- First, let's check what account types exist
SELECT DISTINCT account_type FROM profiles WHERE account_type IS NOT NULL;

-- Drop all existing INSERT policies to start fresh
DROP POLICY IF EXISTS "Producers can insert own tracks" ON tracks;

-- Create a simpler, more explicit INSERT policy
CREATE POLICY "Producers can insert own tracks" ON tracks
  FOR INSERT
  WITH CHECK (
    auth.uid() = track_producer_id
  );

-- Alternative: If the above doesn't work, try this more permissive version
-- DROP POLICY IF EXISTS "Producers can insert own tracks" ON tracks;
-- CREATE POLICY "Producers can insert own tracks" ON tracks
--   FOR INSERT
--   WITH CHECK (true);

-- Verify the fix
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
WHERE tablename = 'tracks' AND cmd = 'INSERT'
ORDER BY policyname;

-- Also check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tracks'; 