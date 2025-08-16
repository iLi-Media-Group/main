-- Debug Feature Flag Issues
-- This script helps identify why the producer applications tab might not be showing

-- 1. Check feature flag status
SELECT 'Feature Flag Status:' as info;
SELECT client_id, feature_name, is_enabled 
FROM white_label_features 
WHERE feature_name = 'producer_onboarding';

-- 2. Check your account type
SELECT 'Your Account Type:' as info;
SELECT id, email, account_type 
FROM profiles 
WHERE email = 'knockriobeats@gmail.com';

-- 3. Check if there are any other constraints on account_type
SELECT 'All Constraints on Profiles:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass
ORDER BY conname;

-- 4. Check if the useFeatureFlag hook should return true for admin users
SELECT 'Admin User Check:' as info;
SELECT 
    CASE 
        WHEN account_type LIKE '%admin%' THEN '✅ Should have admin access'
        ELSE '❌ No admin access'
    END as admin_access,
    email,
    account_type
FROM profiles 
WHERE email = 'knockriobeats@gmail.com';

-- 5. Check if producer_onboarding feature is enabled globally
SELECT 'Global Feature Flag:' as info;
SELECT 
    CASE 
        WHEN is_enabled = true THEN '✅ Feature is enabled globally'
        ELSE '❌ Feature is disabled globally'
    END as global_status,
    client_id,
    feature_name,
    is_enabled
FROM white_label_features 
WHERE feature_name = 'producer_onboarding' 
AND client_id IS NULL; 