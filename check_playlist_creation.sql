-- Check how the playlist was created and compare with producer playlists
-- Run this in the Supabase SQL Editor

-- 1. Check the specific client playlist
SELECT 
    id,
    name,
    slug,
    is_public,
    creator_type,
    producer_id,
    created_at,
    updated_at
FROM playlists 
WHERE slug = 'john-sama/test-list';

-- 2. Check some producer playlists for comparison
SELECT 
    id,
    name,
    slug,
    is_public,
    creator_type,
    producer_id,
    created_at
FROM playlists 
WHERE creator_type = 'producer'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check if there are any other client playlists
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

-- 4. Check if the creator profile exists and has the right account_type
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    p.created_at
FROM profiles p
WHERE p.id = 'c688fcdf-c5fa-46cd-b5c5-eb16f0632458';

-- 5. Check if there are any tracks in the playlist
SELECT 
    pt.id,
    pt.playlist_id,
    pt.track_id,
    pt.position,
    t.title,
    t.artist,
    t.track_producer_id
FROM playlist_tracks pt
LEFT JOIN tracks t ON pt.track_id = t.id
WHERE pt.playlist_id = 'c0fe350b-5328-46af-9d7b-a991b7db339b'
ORDER BY pt.position;
