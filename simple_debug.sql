-- Simple Debug - Run this in Supabase SQL Editor

-- 1. Check if you're authenticated
SELECT 
    'Current user ID:' as info,
    auth.uid() as user_id;

-- 2. Check if the functions exist at all
SELECT 
    'Function check:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'get_user_followed_producers'
AND routine_schema = 'public';

-- 3. Check if the tables exist
SELECT 
    'Table check:' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'producer_follows'
AND table_schema = 'public';

-- 4. Check your profile
SELECT 
    'Profile check:' as info,
    id,
    email,
    account_type
FROM profiles 
WHERE id = auth.uid();

-- 5. Try a simple query on producer_follows
SELECT 
    'Follows check:' as info,
    COUNT(*) as total_follows
FROM producer_follows 
WHERE follower_id = auth.uid();
