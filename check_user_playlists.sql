-- Check playlists for the specific user
-- Run this in the Supabase SQL Editor

-- 1. Check all playlists for this user (John Sama)
SELECT 
    id,
    name,
    slug,
    is_public,
    creator_type,
    producer_id,
    created_at
FROM playlists 
WHERE producer_id = 'c688fcdf-c5fa-46cd-b5c5-eb16f0632458'
ORDER BY created_at DESC;

-- 2. Check if there are any playlists with the exact slug we're looking for
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

-- 3. Check if there are any playlists with similar names
SELECT 
    id,
    name,
    slug,
    is_public,
    creator_type,
    producer_id,
    created_at
FROM playlists 
WHERE name ILIKE '%test%' OR name ILIKE '%list%'
ORDER BY created_at DESC;

-- 4. Check RLS policies for playlists table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'playlists';

-- 5. Test if we can access the playlists as an anonymous user
-- This will help us understand if RLS is blocking access
SELECT 
    id,
    name,
    slug,
    is_public,
    creator_type,
    producer_id
FROM playlists 
WHERE is_public = true
LIMIT 5;
