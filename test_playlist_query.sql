-- Test the exact query that PlaylistService.getPlaylist uses
-- Run this in Supabase SQL Editor

-- Test 1: Simple playlist query (should work)
SELECT 
    id,
    name,
    slug,
    is_public,
    creator_type,
    producer_id
FROM playlists 
WHERE slug = 'john-sama/test-list';

-- Test 2: Check if the producer profile exists
SELECT 
    id,
    first_name,
    last_name,
    email,
    avatar_path
FROM profiles 
WHERE id = 'c688fcdf-c5fa-46cd-b5c5-eb16f0632458';

-- Test 3: Full query with foreign key join (this is what PlaylistService uses)
SELECT 
    p.*,
    pr.id as producer_id,
    pr.first_name,
    pr.last_name,
    pr.email,
    pr.avatar_path
FROM playlists p
LEFT JOIN profiles pr ON p.producer_id = pr.id
WHERE p.slug = 'john-sama/test-list';

-- Test 4: Test with the exact Supabase syntax
-- This simulates what the application is doing
SELECT 
    p.*,
    pr.id as producer_id,
    pr.first_name,
    pr.last_name,
    pr.email,
    pr.avatar_path
FROM playlists p
LEFT JOIN profiles pr ON p.producer_id = pr.id
WHERE p.slug = 'john-sama/test-list'
AND p.is_public = true;
