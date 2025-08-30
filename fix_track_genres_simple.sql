-- Simple fix for the specific track with corrupted genres
-- Based on the data you provided, we know the exact track and the corrupted data

-- 1. Check the current state of the problematic track
SELECT 
    'Before fix' as info,
    id,
    title,
    artist,
    genres,
    created_at
FROM tracks 
WHERE id = 'e67d5a55-fa2a-417b-bd73-78f42a7585af';

-- 2. Fix the specific track - remove the track ID and keep only "Hip-Hop / Rap"
UPDATE tracks 
SET genres = '["Hip-Hop / Rap"]'
WHERE id = 'e67d5a55-fa2a-417b-bd73-78f42a7585af'
  AND genres = '["cfc20f5a-c04e-460b-a47b-36b50aba2c88","Hip-Hop / Rap"]';

-- 3. Check for any other tracks that might have the same issue
SELECT 
    'Other tracks with track ID in genres' as info,
    id,
    title,
    artist,
    genres,
    created_at
FROM tracks 
WHERE genres::text LIKE '%cfc20f5a-c04e-460b-a47b-36b50aba2c88%'
  AND id != 'e67d5a55-fa2a-417b-bd73-78f42a7585af';

-- 4. Fix any other tracks that have the same track ID in genres
UPDATE tracks 
SET genres = REPLACE(genres::text, 'cfc20f5a-c04e-460b-a47b-36b50aba2c88,', '')::text
WHERE genres::text LIKE '%cfc20f5a-c04e-460b-a47b-36b50aba2c88,%';

UPDATE tracks 
SET genres = REPLACE(genres::text, ',cfc20f5a-c04e-460b-a47b-36b50aba2c88', '')::text
WHERE genres::text LIKE '%,cfc20f5a-c04e-460b-a47b-36b50aba2c88%';

UPDATE tracks 
SET genres = REPLACE(genres::text, '"cfc20f5a-c04e-460b-a47b-36b50aba2c88"', '')::text
WHERE genres::text LIKE '%"cfc20f5a-c04e-460b-a47b-36b50aba2c88"%';

-- 5. Clean up any malformed brackets that might result from the replacements
UPDATE tracks 
SET genres = REPLACE(REPLACE(genres::text, '[,', '['), ',]', ']')
WHERE genres::text LIKE '%[,%' OR genres::text LIKE '%,]%';

-- 6. Verify the fix
SELECT 
    'After fix' as info,
    id,
    title,
    artist,
    genres,
    created_at
FROM tracks 
WHERE id = 'e67d5a55-fa2a-417b-bd73-78f42a7585af';

-- 7. Check if there are any remaining tracks with the problematic ID
SELECT 
    'Remaining tracks with track ID in genres' as info,
    id,
    title,
    artist,
    genres,
    created_at
FROM tracks 
WHERE genres::text LIKE '%cfc20f5a-c04e-460b-a47b-36b50aba2c88%';
