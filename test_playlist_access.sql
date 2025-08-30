-- Test the exact same queries that PlaylistService.getPlaylist would run
-- Run this in the Supabase SQL Editor

-- 1. Test the initial playlist fetch (same as PlaylistService.getPlaylist)
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

-- 2. Test the creator profile fetch (same as PlaylistService.getPlaylist)
SELECT 
    id,
    first_name,
    last_name,
    email,
    avatar_path
FROM profiles 
WHERE id = 'c688fcdf-c5fa-46cd-b5c5-eb16f0632458';

-- 3. Test the tracks fetch (same as PlaylistService.getPlaylist)
SELECT 
    pt.*,
    t.id as track_id,
    t.title,
    t.artist,
    t.genres,
    t.sub_genres,
    t.moods,
    t.instruments,
    t.media_usage,
    t.duration,
    t.bpm,
    t.audio_url,
    t.image_url,
    t.has_sting_ending,
    t.is_one_stop,
    t.mp3_url,
    t.trackouts_url,
    t.stems_url,
    t.has_vocals,
    t.is_sync_only,
    t.track_producer_id,
    p.id as producer_id,
    p.first_name as producer_first_name,
    p.last_name as producer_last_name,
    p.email as producer_email,
    p.avatar_path as producer_avatar_path
FROM playlist_tracks pt
LEFT JOIN tracks t ON pt.track_id = t.id
LEFT JOIN profiles p ON t.track_producer_id = p.id
WHERE pt.playlist_id = 'c0fe350b-5328-46af-9d7b-a991b7db339b'
ORDER BY pt.position ASC;

-- 4. Test if the playlist is accessible with the current user context
-- (This simulates what would happen if a user is logged in)
SELECT 
    'Playlist exists' as status,
    id,
    name,
    slug,
    is_public,
    creator_type,
    producer_id
FROM playlists 
WHERE slug = 'john-sama/test-list'
AND is_public = true;
