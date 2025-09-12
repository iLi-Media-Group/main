-- Check the current playlist structure and data
-- Run this in Supabase SQL Editor

-- Check the playlist table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'playlists'
ORDER BY ordinal_position;

-- Check the current playlist data
SELECT 
    id,
    name,
    slug,
    producer_id,
    creator_type,
    is_public,
    created_at
FROM playlists
ORDER BY created_at DESC
LIMIT 10;

-- Check if the producer_id actually points to a valid profile
SELECT 
    p.id as playlist_id,
    p.name as playlist_name,
    p.producer_id,
    p.creator_type,
    pr.id as profile_id,
    pr.first_name,
    pr.last_name,
    pr.email,
    pr.account_type
FROM playlists p
LEFT JOIN profiles pr ON p.producer_id = pr.id
ORDER BY p.created_at DESC
LIMIT 10;

-- Check the specific playlist we're testing
SELECT 
    p.id as playlist_id,
    p.name as playlist_name,
    p.slug,
    p.producer_id,
    p.creator_type,
    p.is_public,
    pr.id as profile_id,
    pr.first_name,
    pr.last_name,
    pr.email,
    pr.account_type
FROM playlists p
LEFT JOIN profiles pr ON p.producer_id = pr.id
WHERE p.slug = 'john-sama/test-list';
