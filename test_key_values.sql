-- Test Different Key Values

-- First, let's see what key values are currently in the database
SELECT 'Current key values:' as info;
SELECT DISTINCT key FROM tracks WHERE key IS NOT NULL ORDER BY key LIMIT 5;

-- Now let's test different key formats
SELECT 'Testing key formats:' as info;

-- Test 1: Try with NULL (should work since it's nullable)
INSERT INTO tracks (
  track_producer_id,
  title,
  artist,
  genres,
  sub_genres,
  moods,
  instruments,
  media_usage,
  bpm,
  key,
  has_sting_ending,
  is_one_stop,
  has_vocals,
  is_sync_only,
  explicit_lyrics,
  contains_loops,
  contains_samples,
  contains_splice_loops,
  samples_cleared
) VALUES (
  '83e21f94-aced-452a-bafb-6eb9629e3b18',
  'TEST TRACK - NULL KEY',
  'Test Artist',
  ARRAY['test'],
  ARRAY['test'],
  ARRAY['test'],
  ARRAY['test'],
  ARRAY['test'],
  120,
  NULL,  -- Try NULL
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false
) RETURNING id, title, key;

-- Clean up
DELETE FROM tracks WHERE title = 'TEST TRACK - NULL KEY';
