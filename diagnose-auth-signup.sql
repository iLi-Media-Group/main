-- Diagnose Auth Signup Issues
-- This script helps identify why auth user creation is failing

-- 1. Check current auth users
SELECT 'CURRENT AUTH USERS:' as info;
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email LIKE '%peppah%' OR email LIKE '%test%'
ORDER BY created_at DESC;

-- 2. Check current profiles
SELECT 'CURRENT PROFILES:' as info;
SELECT 
  id,
  email,
  account_type,
  created_at,
  updated_at
FROM profiles 
WHERE email LIKE '%peppah%' OR email LIKE '%test%'
ORDER BY created_at DESC;

-- 3. Check if there are any constraints that might be blocking auth user creation
SELECT 'CONSTRAINTS ON PROFILES:' as info;
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'profiles'
  AND tc.table_schema = 'public';

-- 4. Check if there are any triggers on profiles that might be failing
SELECT 'TRIGGERS ON PROFILES:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 5. Check if the generate_producer_number function exists and works
SELECT 'PRODUCER NUMBER FUNCTION:' as info;
SELECT 
  p.proname as function_name,
  p.prorettype::regtype as return_type,
  p.prosecdef as security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('generate_producer_number', 'get_next_producer_number')
ORDER BY p.proname;

-- 6. Test the generate_producer_number function
SELECT 'TESTING PRODUCER NUMBER FUNCTION:' as info;
SELECT 
  'generate_producer_number()' as function_name,
  generate_producer_number() as result;

-- 7. Check if producer_balances table exists
SELECT 'PRODUCER BALANCES TABLE:' as info;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'producer_balances'
) as table_exists;

-- 8. Check RLS policies on profiles
SELECT 'RLS POLICIES ON PROFILES:' as info;
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
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 9. Check if there are any recent errors in the logs (if accessible)
SELECT 'RECENT LOGS (if accessible):' as info;
-- This might not work depending on permissions
SELECT 
  log_time,
  user_name,
  database_name,
  session_id,
  command_tag,
  message
FROM pg_stat_activity 
WHERE state = 'active'
AND query LIKE '%profiles%'
ORDER BY log_time DESC
LIMIT 10;

-- 10. Test a simple profile insert to see what happens
SELECT 'TESTING SIMPLE PROFILE INSERT:' as info;
-- This will help identify if the issue is with the profile creation itself
DO $$
DECLARE
  test_id uuid := gen_random_uuid();
  test_email text := 'test-diagnostic-' || extract(epoch from now()) || '@example.com';
  insert_error text;
BEGIN
  BEGIN
    INSERT INTO profiles (
      id,
      email,
      account_type,
      created_at,
      updated_at
    ) VALUES (
      test_id,
      test_email,
      'client',
      now(),
      now()
    );
    RAISE NOTICE '✅ Simple profile insert successful for: %', test_email;
    
    -- Clean up
    DELETE FROM profiles WHERE id = test_id;
    RAISE NOTICE '✅ Test profile cleaned up';
    
  EXCEPTION WHEN OTHERS THEN
    insert_error := SQLERRM;
    RAISE NOTICE '❌ Profile insert failed: %', insert_error;
  END;
END $$;

-- 11. Check Supabase configuration
SELECT 'SUPABASE CONFIGURATION:' as info;
SELECT 
  name,
  setting,
  unit,
  context
FROM pg_settings 
WHERE name IN (
  'max_connections',
  'shared_preload_libraries',
  'wal_level',
  'max_wal_senders'
)
ORDER BY name;
