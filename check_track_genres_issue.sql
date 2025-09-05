-- Check for track with corrupted genres data
-- This script will help identify if the track ID is being stored in the genres field

-- 1. Check if the specific track exists
SELECT 
    'Track with ID' as info,
    id,
    title,
    artist,
    genres,
    created_at
FROM tracks 
WHERE id = 'cfc20f5a-c04e-460b-a47b-36b50aba2c88';

-- 2. Check for any tracks that have track IDs in their genres field
SELECT 
    'Tracks with potential ID in genres' as info,
    id,
    title,
    artist,
    genres,
    created_at
FROM tracks 
WHERE genres::text LIKE '%cfc20f5a-c04e-460b-a47b-36b50aba2c88%'
   OR genres::text LIKE '%[%'
   OR genres::text LIKE '%]%';

-- 3. Check for any tracks with malformed genres data (contains brackets or IDs)
SELECT 
    'Tracks with malformed genres' as info,
    id,
    title,
    artist,
    genres,
    created_at
FROM tracks 
WHERE genres::text LIKE '%[%'
   OR genres::text LIKE '%]%'
   OR genres::text LIKE '%-%' -- UUID pattern
   OR genres::text LIKE '%[%cfc20f5a-c04e-460b-a47b-36b50aba2c88%]%';

-- 4. Show recent tracks to see the pattern
SELECT 
    'Recent tracks for comparison' as info,
    id,
    title,
    artist,
    genres,
    created_at
FROM tracks 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check if there are any tracks with the specific pattern mentioned
-- Genres: ["cfc20f5a-c04e-460b-a47b-36b50aba2c88", "Hip-Hop / Rap"]
SELECT 
    'Tracks matching the exact pattern' as info,
    id,
    title,
    artist,
    genres,
    created_at
FROM tracks 
WHERE genres::text LIKE '%cfc20f5a-c04e-460b-a47b-36b50aba2c88%'
   AND genres::text LIKE '%Hip-Hop / Rap%';
