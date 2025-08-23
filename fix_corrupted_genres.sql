-- Fix corrupted genres data
-- This script will clean up any tracks that have track IDs mixed into their genres

-- 1. First, let's see what we're working with
SELECT 
    'Before fix - tracks with corrupted genres' as info,
    id,
    title,
    artist,
    genres,
    created_at
FROM tracks 
WHERE genres::text LIKE '%cfc20f5a-c04e-460b-a47b-36b50aba2c88%'
   OR genres::text LIKE '%[%'
   OR genres::text LIKE '%]%';

-- 2. Fix tracks that have the specific track ID in their genres
-- Remove the track ID and keep only valid genre names
UPDATE tracks 
SET genres = (
    SELECT array_to_json(array_agg(genre_item))::text
    FROM (
        SELECT json_array_elements_text(genres::json) as genre_item
        WHERE json_array_elements_text(genres::json) != 'cfc20f5a-c04e-460b-a47b-36b50aba2c88'
          AND json_array_elements_text(genres::json) NOT LIKE '%-%' -- Remove UUID patterns
    ) valid_genres
)
WHERE genres::text LIKE '%cfc20f5a-c04e-460b-a47b-36b50aba2c88%';

-- 3. Fix any tracks that have bracket notation in genres  
-- Convert from ["genre1", "genre2"] format to proper array
UPDATE tracks 
SET genres = (
    SELECT array_to_json(array_agg(genre_item))::text
    FROM (
        SELECT json_array_elements_text(genres::json) as genre_item
        WHERE json_array_elements_text(genres::json) NOT LIKE '%-%' -- Remove UUID patterns
          AND json_array_elements_text(genres::json) != ''
          AND json_array_elements_text(genres::json) IS NOT NULL
    ) valid_genres
)
WHERE genres::text LIKE '%[%' OR genres::text LIKE '%]%';

-- 4. Verify the fix
SELECT 
    'After fix - tracks that were corrupted' as info,
    id,
    title,
    artist,
    genres,
    created_at
FROM tracks 
WHERE id IN (
    SELECT id FROM tracks 
    WHERE genres::text LIKE '%cfc20f5a-c04e-460b-a47b-36b50aba2c88%'
       OR genres::text LIKE '%[%'
       OR genres::text LIKE '%]%'
);

-- 5. Show a sample of recent tracks to confirm the fix worked
SELECT 
    'Sample of recent tracks after fix' as info,
    id,
    title,
    artist,
    genres,
    created_at
FROM tracks 
ORDER BY created_at DESC 
LIMIT 5;
