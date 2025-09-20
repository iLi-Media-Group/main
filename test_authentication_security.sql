-- TEST AUTHENTICATION SECURITY: Test what happens when different account types access profiles
-- This will show us the real security issue with actual authentication

-- First, let's see what account types exist in the system
SELECT 
    'ACCOUNT TYPES IN SYSTEM' as info,
    account_type,
    COUNT(*) as count
FROM profiles 
GROUP BY account_type
ORDER BY count DESC;

-- Show sample profiles by account type
SELECT 
    'SAMPLE PROFILES BY ACCOUNT TYPE' as info,
    id,
    email,
    account_type,
    first_name,
    last_name,
    company_name,
    created_at
FROM profiles 
ORDER BY account_type, created_at
LIMIT 20;

-- Test what happens when we try to access profiles without authentication
SELECT 
    'TEST WITHOUT AUTHENTICATION' as test_type,
    COUNT(*) as accessible_profiles,
    'This should be 0 if RLS is working properly' as expected
FROM profiles;

-- Check if RLS is enabled
SELECT 
    'RLS STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';
