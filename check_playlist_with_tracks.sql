-- Check the current state of the playlist after tracks were added
-- Run this in the Supabase SQL Editor

-- 1. Check the playlist details
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

-- 2. Check if tracks were added to the playlist
SELECT 
    pt.id as playlist_track_id,
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

-- 3. Count tracks in the playlist
SELECT COUNT(*) as track_count
FROM playlist_tracks 
WHERE playlist_id = 'c0fe350b-5328-46af-9d7b-a991b7db339b';

-- 4. Test the exact query that PlaylistService.getPlaylist would run
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
