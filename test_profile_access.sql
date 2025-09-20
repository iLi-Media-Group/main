-- TEST PROFILE ACCESS: See what happens when we try to access a specific profile
-- This will show us if RLS is properly blocking access to other people's profiles

-- First, let's see what profile we're currently authenticated as
SELECT 
    'CURRENT USER PROFILE' as info,
    auth.uid() as current_user_id,
    p.id as profile_id,
    p.email as profile_email,
    p.account_type,
    p.first_name,
    p.last_name
FROM profiles p
WHERE p.id = auth.uid();

-- Now let's try to access a different profile (this should be blocked by RLS)
SELECT 
    'ATTEMPTING TO ACCESS OTHER PROFILES' as info,
    COUNT(*) as accessible_other_profiles
FROM profiles 
WHERE id != auth.uid();

-- Let's try to access a specific profile that's not ours
SELECT 
    'ATTEMPTING TO ACCESS SPECIFIC OTHER PROFILE' as info,
    id,
    email,
    account_type,
    first_name,
    last_name
FROM profiles 
WHERE id != auth.uid()
LIMIT 1;
