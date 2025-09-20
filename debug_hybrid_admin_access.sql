-- Debug Hybrid Admin Access
-- This script debugs why the hybrid admin access isn't working

-- ============================================
-- 1. CHECK CURRENT USER DETAILS
-- ============================================

SELECT
    'Current user details:' as info;
SELECT
    'Current user ID' as field,
    auth.uid() as value;

-- ============================================
-- 2. CHECK USER PROFILE
-- ============================================

SELECT
    'User profile check:' as info;
SELECT
    id,
    email,
    account_type,
    created_at,
    updated_at
FROM profiles
WHERE id = auth.uid();

-- ============================================
-- 3. TEST DIFFERENT ROLE MATCHES
-- ============================================

SELECT
    'Testing different role matches:' as info;
SELECT
    'Exact match admin' as test,
    CASE WHEN account_type = 'admin' THEN '✅ MATCHES' ELSE '❌ NO MATCH' END as result
FROM profiles
WHERE id = auth.uid()

UNION ALL

SELECT
    'Exact match admin,producer' as test,
    CASE WHEN account_type = 'admin,producer' THEN '✅ MATCHES' ELSE '❌ NO MATCH' END as result
FROM profiles
WHERE id = auth.uid()

UNION ALL

SELECT
    'LIKE %admin%' as test,
    CASE WHEN account_type LIKE '%admin%' THEN '✅ MATCHES' ELSE '❌ NO MATCH' END as result
FROM profiles
WHERE id = auth.uid()

UNION ALL

SELECT
    'LIKE admin%' as test,
    CASE WHEN account_type LIKE 'admin%' THEN '✅ MATCHES' ELSE '❌ NO MATCH' END as result
FROM profiles
WHERE id = auth.uid()

UNION ALL

SELECT
    'LIKE %admin' as test,
    CASE WHEN account_type LIKE '%admin' THEN '✅ MATCHES' ELSE '❌ NO MATCH' END as result
FROM profiles
WHERE id = auth.uid();

-- ============================================
-- 4. CHECK ALL USERS WITH ADMIN ACCESS
-- ============================================

SELECT
    'All users with admin in account_type:' as info;
SELECT
    id,
    email,
    account_type,
    CASE
        WHEN account_type LIKE '%admin%' THEN '✅ HAS ADMIN'
        ELSE '❌ NO ADMIN'
    END as admin_status
FROM profiles
WHERE account_type LIKE '%admin%'
ORDER BY account_type, email;

-- ============================================
-- 5. TEST RLS POLICY DIRECTLY
-- ============================================

SELECT
    'Testing RLS policy directly:' as info;
SELECT
    CASE
        WHEN auth.uid() IN (
            SELECT id FROM profiles 
            WHERE account_type LIKE '%admin%'
        ) THEN '✅ POLICY SHOULD ALLOW ACCESS'
        ELSE '❌ POLICY WILL BLOCK ACCESS'
    END as policy_test;

-- ============================================
-- 6. CHECK IF USER EXISTS IN PROFILES
-- ============================================

SELECT
    'Checking if user exists in profiles:' as info;
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN '✅ USER EXISTS IN PROFILES'
        ELSE '❌ USER NOT FOUND IN PROFILES'
    END as user_exists;

-- ============================================
-- 7. SHOW ALL PROFILES FOR DEBUGGING
-- ============================================

SELECT
    'All profiles (for debugging):' as info;
SELECT
    id,
    email,
    account_type,
    created_at
FROM profiles
ORDER BY account_type, email;

-- ============================================
-- 8. TEST MANUAL INSERT
-- ============================================

-- Try to insert a test discount to see the exact error
SELECT
    'Attempting manual insert test:' as info;
SELECT
    CASE
        WHEN auth.uid() IN (
            SELECT id FROM profiles 
            WHERE account_type LIKE '%admin%'
        ) THEN '✅ SHOULD BE ABLE TO INSERT'
        ELSE '❌ WILL GET PERMISSION DENIED'
    END as insert_test; 