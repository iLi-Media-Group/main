-- Check RLS Policies for Track Duration Updates
-- This script identifies the exact RLS policies that control who can update track durations

SELECT '=== TRACKS TABLE RLS POLICIES ===' as section;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'tracks' 
ORDER BY policyname;

SELECT '=== RLS STATUS ===' as section;
SELECT 
  tablename, 
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'RLS is ENABLED - policies control access'
    ELSE 'RLS is DISABLED - no access control'
  END as status
FROM pg_tables 
WHERE tablename = 'tracks';

SELECT '=== TRACKS TABLE OWNERSHIP ===' as section;
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename = 'tracks';

SELECT '=== CURRENT USER CONTEXT ===' as section;
SELECT 
  current_user as current_user,
  session_user as session_user,
  current_setting('role') as current_role;

-- Check if there are any specific policies for duration updates
SELECT '=== POLICIES ALLOWING DURATION UPDATES ===' as section;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual as policy_condition,
  CASE 
    WHEN cmd = 'UPDATE' THEN '✅ Allows updates'
    WHEN cmd = 'SELECT' THEN '📖 Read only'
    WHEN cmd = 'INSERT' THEN '➕ Insert only'
    WHEN cmd = 'DELETE' THEN '🗑️ Delete only'
    ELSE '❓ Unknown command'
  END as access_type
FROM pg_policies 
WHERE tablename = 'tracks' 
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- ============================================
-- CREATE ADMIN OVERRIDE POLICY FOR DURATION UPDATES
-- ============================================

-- First, check if the admin policy already exists
SELECT '=== CHECKING FOR EXISTING ADMIN POLICY ===' as section;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'tracks' 
  AND policyname LIKE '%admin%'
ORDER BY policyname;

-- Create admin override policy for track duration updates
-- This allows admin and admin,producer accounts to update any track duration
SELECT '=== CREATING ADMIN OVERRIDE POLICY ===' as section;

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admin can update track durations" ON tracks;

-- Create new admin policy for duration updates
CREATE POLICY "Admin can update track durations" ON tracks
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (
      profiles.account_type = 'admin' 
      OR profiles.account_type = 'admin,producer'
      OR profiles.account_type LIKE '%admin%'
    )
  )
);

-- Verify the new policy was created
SELECT '=== VERIFYING NEW ADMIN POLICY ===' as section;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual as policy_condition,
  CASE 
    WHEN cmd = 'UPDATE' THEN '✅ Allows updates'
    WHEN cmd = 'SELECT' THEN '📖 Read only'
    WHEN cmd = 'INSERT' THEN '➕ Insert only'
    WHEN cmd = 'DELETE' THEN '🗑️ Delete only'
    ELSE '❓ Unknown command'
  END as access_type
FROM pg_policies 
WHERE tablename = 'tracks' 
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- Test the policy by checking if your account type is recognized
SELECT '=== TESTING ADMIN POLICY ===' as section;
SELECT 
  id,
  email,
  account_type,
  CASE 
    WHEN account_type = 'admin' OR account_type = 'admin,producer' OR account_type LIKE '%admin%'
    THEN '✅ Has admin access for duration updates'
    ELSE '❌ No admin access for duration updates'
  END as admin_status
FROM profiles 
WHERE email = 'knockriobeats@gmail.com';
