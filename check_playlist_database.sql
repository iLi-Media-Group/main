-- Check playlist database directly
-- Run this in the Supabase SQL Editor

-- 1. Check if the playlist exists with the exact slug
SELECT 
    id,
    name,
    slug,
    is_public,
    creator_type,
    producer_id,
    created_at
FROM playlists 
WHERE slug = 'john-sama/test-list';

-- 2. Check if there are any playlists with similar slugs
SELECT 
    id,
    name,
    slug,
    is_public,
    creator_type,
    producer_id,
    created_at
FROM playlists 
WHERE slug LIKE '%john%' OR slug LIKE '%test%'
ORDER BY created_at DESC;

-- 3. Check if there are any playlists for clients
SELECT 
    id,
    name,
    slug,
    is_public,
    creator_type,
    producer_id,
    created_at
FROM playlists 
WHERE creator_type = 'client'
ORDER BY created_at DESC;

-- 4. Check if the producer profile exists (if we find a playlist)
-- Replace 'USER_ID_HERE' with the actual producer_id from step 1
-- SELECT 
--     id,
--     first_name,
--     last_name,
--     email,
--     account_type
-- FROM profiles 
-- WHERE id = 'USER_ID_HERE';

-- 5. Check RLS policies on playlists table
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
WHERE tablename = 'playlists';

-- 6. Check if the playlists table has the creator_type column
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'playlists' 
AND column_name = 'creator_type';
