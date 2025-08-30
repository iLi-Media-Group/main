-- Debug RPC Functions
-- Run this in Supabase SQL Editor to diagnose the 400 errors

-- 1. Check if the functions exist
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name IN (
    'get_user_followed_producers',
    'get_user_favorited_playlists',
    'toggle_producer_follow',
    'unfollow_producer',
    'is_following_producer',
    'get_producer_followers',
    'toggle_playlist_favorite'
)
AND routine_schema = 'public'
ORDER BY routine_name;

-- 2. Check if the tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('producer_follows', 'playlist_favorites')
AND table_schema = 'public';

-- 3. Check the current user's profile
SELECT 
    id,
    email,
    first_name,
    last_name,
    account_type
FROM profiles 
WHERE id = auth.uid();

-- 4. Test the get_user_followed_producers function with error handling
DO $$
DECLARE
    v_result RECORD;
    v_error TEXT;
BEGIN
    BEGIN
        -- Try to call the function
        SELECT * INTO v_result FROM get_user_followed_producers(10);
        RAISE NOTICE 'Function executed successfully';
    EXCEPTION WHEN OTHERS THEN
        v_error := SQLERRM;
        RAISE NOTICE 'Error in get_user_followed_producers: %', v_error;
    END;
END $$;

-- 5. Test the get_user_favorited_playlists function with error handling
DO $$
DECLARE
    v_result RECORD;
    v_error TEXT;
BEGIN
    BEGIN
        -- Try to call the function
        SELECT * INTO v_result FROM get_user_favorited_playlists(10);
        RAISE NOTICE 'Function executed successfully';
    EXCEPTION WHEN OTHERS THEN
        v_error := SQLERRM;
        RAISE NOTICE 'Error in get_user_favorited_playlists: %', v_error;
    END;
END $$;

-- 6. Check RLS policies on producer_follows table
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
WHERE tablename = 'producer_follows'
ORDER BY policyname;

-- 7. Check if there are any follows for the current user
SELECT 
    pf.id,
    pf.follower_id,
    pf.producer_id,
    pf.email_notifications_enabled,
    p.first_name,
    p.last_name
FROM producer_follows pf
JOIN profiles p ON pf.producer_id = p.id
WHERE pf.follower_id = auth.uid();
