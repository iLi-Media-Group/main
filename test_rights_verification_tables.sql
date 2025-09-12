-- Test Rights Verification Tables Access
-- This script checks if the tables needed for rights verification exist and are accessible

-- Check if rights_holders table exists and is accessible
SELECT 
  'rights_holders' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN 'Accessible'
    ELSE 'Not accessible'
  END as status
FROM rights_holders;

-- Check if rights_holder_profiles table exists and is accessible
SELECT 
  'rights_holder_profiles' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN 'Accessible'
    ELSE 'Not accessible'
  END as status
FROM rights_holder_profiles;

-- Check if master_recordings table exists and is accessible
SELECT 
  'master_recordings' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN 'Accessible'
    ELSE 'Not accessible'
  END as status
FROM master_recordings;

-- Check RLS policies on rights_holders
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'rights_holders';

-- Check RLS policies on rights_holder_profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'rights_holder_profiles';

-- Check RLS policies on master_recordings
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'master_recordings';

-- Test a sample query that the component would make
SELECT 
  'Test query' as test_type,
  COUNT(*) as rights_holders_count
FROM rights_holders rh
LEFT JOIN rights_holder_profiles rhp ON rh.id = rhp.rights_holder_id;
