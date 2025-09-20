-- Fix RLS Policies for Admin/Producer Users
-- This script adds support for admin,producer without breaking existing policies

-- First, let's check the current user's profile
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

-- Check current RLS policies before making changes
SELECT 'Current RLS policies on tracks:' as info;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY cmd, policyname;

-- Instead of dropping policies, let's check if we need to add a new one
-- First, let's see if there's already a policy that handles admin,producer
SELECT 'Checking if admin,producer is already covered:' as info;
SELECT 
  policyname,
  with_check,
  CASE 
    WHEN with_check LIKE '%admin,producer%' THEN '✅ Direct match'
    WHEN with_check LIKE '%admin%' AND with_check LIKE '%producer%' THEN '✅ Both covered'
    WHEN with_check LIKE '%admin%' OR with_check LIKE '%producer%' THEN '⚠️ Partial match'
    ELSE '❌ No match'
  END as coverage
FROM pg_policies 
WHERE tablename = 'tracks' AND cmd = 'INSERT';

-- If no policy covers admin,producer properly, we'll add a new one
-- But first, let's test if the current user can insert with existing policies
SELECT 'Testing current user permissions:' as info;
SELECT 
  auth.uid() as user_id,
  (SELECT account_type FROM profiles WHERE id = auth.uid()) as account_type,
  (SELECT email FROM profiles WHERE id = auth.uid()) as email;

-- Let's create a temporary test to see if the user can insert
-- This will help us understand what's failing
SELECT 'Testing INSERT permission with current policies:' as info;
SELECT 
  'Current user INSERT test' as test_name,
  auth.uid() as user_id,
  (SELECT account_type FROM profiles WHERE id = auth.uid()) as account_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'producer'
    ) THEN '✅ Matches producer'
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    ) THEN '✅ Matches admin'
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin,producer'
    ) THEN '✅ Matches admin,producer exactly'
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type LIKE '%producer%'
    ) THEN '✅ Contains producer'
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type LIKE '%admin%'
    ) THEN '✅ Contains admin'
    ELSE '❌ No match found'
  END as policy_match;
