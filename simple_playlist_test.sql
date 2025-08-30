-- Simple test to check playlist accessibility
-- Run this in Supabase SQL Editor

-- Test 1: Check if playlist exists and is public
SELECT 
    id,
    name,
    slug,
    is_public,
    creator_type,
    producer_id
FROM playlists 
WHERE slug = 'john-sama/test-list';

-- Test 2: Check if the creator profile exists
SELECT 
    id,
    first_name,
    last_name,
    email,
    account_type
FROM profiles 
WHERE id = 'c688fcdf-c5fa-46cd-b5c5-eb16f0632458';

-- Test 3: Check if there are any tracks in the playlist
SELECT 
    pt.id,
    pt.playlist_id,
    pt.track_id,
    t.title,
    t.artist
FROM playlist_tracks pt
LEFT JOIN tracks t ON pt.track_id = t.id
WHERE pt.playlist_id = 'c0fe350b-5328-46af-9d7b-a991b7db339b';
