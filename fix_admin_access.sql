-- Fix Admin Access for Track Durations Page
-- This script checks and fixes the account type for admin users

-- ============================================
-- 1. CHECK CURRENT ACCOUNT TYPES
-- ============================================

-- See all admin users and their current account types
SELECT 'Current Admin Account Types:' as info;
SELECT 
    id, 
    email, 
    account_type,
    created_at
FROM profiles 
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
ORDER BY created_at DESC;

-- See all users with admin-related account types
SELECT 'All Users with Admin Account Types:' as info;
SELECT 
    id, 
    email, 
    account_type,
    created_at
FROM profiles 
WHERE account_type LIKE '%admin%'
ORDER BY created_at DESC;

-- ============================================
-- 2. FIX ACCOUNT TYPES
-- ============================================

-- Update admin users to have appropriate account_type (preserve dual roles)
UPDATE profiles 
SET account_type = 'admin,producer'
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
AND account_type NOT LIKE '%admin%';

-- ============================================
-- 3. VERIFY THE FIXES
-- ============================================

-- Check the results
SELECT 'Updated Admin Account Types:' as info;
SELECT 
    id, 
    email, 
    account_type,
    created_at
FROM profiles 
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
ORDER BY created_at DESC;

-- Show all admin users after the fix
SELECT 'All Admin Users After Fix:' as info;
SELECT 
    id, 
    email, 
    account_type,
    created_at
FROM profiles 
WHERE account_type = 'admin'
ORDER BY created_at DESC;

-- ============================================
-- 4. CHECK ACCOUNT TYPE CONSTRAINT
-- ============================================

-- Verify the account_type constraint supports 'admin'
SELECT 'Account Type Constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname = 'profiles_account_type_check';
