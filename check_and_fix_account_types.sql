-- Check and Fix Account Types
-- This script helps identify and fix account type issues

-- ============================================
-- 1. CHECK CURRENT ACCOUNT TYPES
-- ============================================

-- See all account types in the system
SELECT 
    account_type, 
    COUNT(*) as user_count
FROM profiles 
GROUP BY account_type 
ORDER BY user_count DESC;

-- See all admin users
SELECT 
    email,
    account_type,
    created_at
FROM profiles 
WHERE account_type LIKE '%admin%'
ORDER BY created_at DESC;

-- See all producer users
SELECT 
    email,
    account_type,
    created_at
FROM profiles 
WHERE account_type LIKE '%producer%'
ORDER BY created_at DESC;

-- ============================================
-- 2. FIX ACCOUNT TYPES
-- ============================================

-- Update main admin accounts to have dual role
UPDATE profiles 
SET account_type = 'admin,producer'
WHERE email = 'knockriobeats@gmail.com';

UPDATE profiles 
SET account_type = 'admin,producer'
WHERE email = 'info@mybeatfi.io';

UPDATE profiles 
SET account_type = 'admin,producer'
WHERE email = 'derykbanks@yahoo.com';

-- If you have other admin emails, add them here
-- UPDATE profiles SET account_type = 'admin,producer' WHERE email = 'your-email@example.com';

-- ============================================
-- 3. VERIFY THE FIXES
-- ============================================

-- Check the results
SELECT 
    'profiles with admin,producer' as description,
    COUNT(*) as count
FROM profiles 
WHERE account_type = 'admin,producer';

-- Show all admin users after the fix
SELECT 
    email,
    account_type,
    created_at
FROM profiles 
WHERE account_type LIKE '%admin%'
ORDER BY created_at DESC;

-- Show all producer users after the fix
SELECT 
    email,
    account_type,
    created_at
FROM profiles 
WHERE account_type LIKE '%producer%'
ORDER BY created_at DESC; 