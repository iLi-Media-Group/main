-- TEST CLIENT PROFILE ACCESS: Check if client profiles can be accessed
-- This will help us understand if the RLS policies are working for clients

-- Check if we can access any profiles at all
SELECT 
    'PROFILE ACCESS TEST' as info,
    COUNT(*) as accessible_profiles
FROM profiles;

-- Check if we can access client profiles specifically
SELECT 
    'CLIENT PROFILE ACCESS' as info,
    COUNT(*) as client_profiles
FROM profiles 
WHERE account_type = 'client';

-- Check what account types we can access
SELECT 
    'ACCOUNT TYPES ACCESSIBLE' as info,
    account_type,
    COUNT(*) as count
FROM profiles 
GROUP BY account_type
ORDER BY count DESC;
