-- Remove duplicate RLS policies on tracks table
-- Keep the working policies and remove the duplicates

-- Drop the duplicate policies (the ones with generic names)
DROP POLICY IF EXISTS "Producers can delete own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can insert own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can update own tracks" ON tracks;
DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;

-- Keep the specific named policies:
-- tracks_delete_policy
-- tracks_insert_policy  
-- tracks_select_policy
-- tracks_update_policy

-- Verify the remaining policies
SELECT 'Remaining RLS policies on tracks:' as info;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY policyname;

-- Test that tracks can be queried
SELECT 'Testing tracks query after removing duplicates:' as info;
SELECT COUNT(*) as track_count FROM tracks;

-- Show a few sample tracks to verify access
SELECT 'Sample tracks:' as info;
SELECT 
  id,
  title,
  genres,
  sub_genres,
  moods,
  instruments,
  media_usage
FROM tracks 
LIMIT 3;
