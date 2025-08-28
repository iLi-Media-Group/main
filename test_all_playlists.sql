-- Test all playlists to see if they're accessible
-- Run this in the Supabase SQL Editor

-- 1. Check all playlists in the database
SELECT 
    id,
    name,
    slug,
    is_public,
    creator_type,
    producer_id,
    created_at
FROM playlists 
ORDER BY created_at DESC;

-- 2. Check if there are any tracks in any playlists
SELECT 
    p.name as playlist_name,
    p.slug,
    p.creator_type,
    COUNT(pt.id) as track_count
FROM playlists p
LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
GROUP BY p.id, p.name, p.slug, p.creator_type
ORDER BY p.created_at DESC;

-- 3. Test access to a producer playlist (if one exists)
SELECT 
    id,
    name,
    slug,
    is_public,
    creator_type,
    producer_id
FROM playlists 
WHERE creator_type = 'producer'
ORDER BY created_at DESC
LIMIT 1;
