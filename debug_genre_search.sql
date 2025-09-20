-- Debug genre search issue
-- Check what genres are actually stored in the database

-- 1. Check a few sample tracks and their genre data
SELECT 
  id,
  title,
  genres,
  sub_genres,
  moods,
  is_sync_only,
  has_vocals
FROM tracks 
WHERE deleted_at IS NULL 
LIMIT 10;

-- 2. Check all unique genres in the database
SELECT DISTINCT genres 
FROM tracks 
WHERE deleted_at IS NULL 
AND genres IS NOT NULL 
AND genres != '';

-- 3. Test a specific genre search
SELECT 
  id,
  title,
  genres,
  sub_genres,
  moods
FROM tracks 
WHERE deleted_at IS NULL 
AND is_sync_only = false
AND (
  genres ILIKE '%hip hop%' OR
  genres ILIKE '%pop%' OR
  genres ILIKE '%rock%' OR
  genres ILIKE '%electronic%'
)
LIMIT 5;

-- 4. Check if there are any tracks at all
SELECT COUNT(*) as total_tracks,
       COUNT(CASE WHEN is_sync_only = false THEN 1 END) as non_sync_tracks,
       COUNT(CASE WHEN has_vocals = true THEN 1 END) as vocal_tracks,
       COUNT(CASE WHEN is_sync_only = true THEN 1 END) as sync_only_tracks
FROM tracks 
WHERE deleted_at IS NULL; 