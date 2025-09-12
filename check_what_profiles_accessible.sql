-- CHECK WHAT PROFILES ARE ACCESSIBLE: See exactly what profiles the current user can access
-- This will show us if they're accessing profiles they shouldn't be

-- Show what profiles the current user can access
SELECT 
    id,
    email,
    account_type,
    first_name,
    last_name,
    company_name,
    created_at
FROM profiles 
ORDER BY created_at;

-- Check if the current user is accessing their own profile
SELECT 
    'CURRENT USER ACCESS CHECK' as info,
    auth.uid() as current_user_id,
    COUNT(*) as total_accessible_profiles,
    COUNT(CASE WHEN id = auth.uid() THEN 1 END) as own_profile_count,
    COUNT(CASE WHEN id != auth.uid() THEN 1 END) as other_profiles_count
FROM profiles;
