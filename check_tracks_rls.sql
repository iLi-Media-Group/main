-- Check RLS policies on tracks table and test access
-- Run this in the Supabase SQL Editor

-- 1. Check current RLS policies on tracks table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'tracks';

-- 2. Check if RLS is enabled on tracks table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'tracks';

-- 3. Test if we can access tracks directly
SELECT 
    id,
    title,
    artist,
    track_producer_id
FROM tracks 
LIMIT 5;

-- 4. Test if we can access tracks through playlist_tracks join
SELECT 
    pt.id as playlist_track_id,
    pt.playlist_id,
    pt.track_id,
    t.title,
    t.artist,
    t.track_producer_id
FROM playlist_tracks pt
LEFT JOIN tracks t ON pt.track_id = t.id
WHERE pt.playlist_id = 'c0fe350b-5328-46af-9d7b-a991b7db339b'
LIMIT 5;

-- 5. Check if there are any tracks in the specific playlist
SELECT COUNT(*) as track_count
FROM playlist_tracks 
WHERE playlist_id = 'c0fe350b-5328-46af-9d7b-a991b7db339b';

-- 6. Check if the tracks table has any data at all
SELECT COUNT(*) as total_tracks
FROM tracks;
