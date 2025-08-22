-- Test Track Insert with Minimal Data
-- This will help us determine if the issue is with RLS or form data

-- First, let's check if we can insert a simple track record
-- We'll use the same user ID that has existing tracks

SELECT 'Testing minimal track insert:' as info;

-- Try to insert a test track with minimal required fields
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
  '83e21f94-aced-452a-bafb-6eb9629e3b18',  -- Your user ID
  'TEST TRACK - RLS TEST',
  'Test Artist',
  ARRAY['test'],
  ARRAY['test'],
  ARRAY['test'],
  ARRAY['test'],
  ARRAY['test'],
  120,
  'C',
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false
) RETURNING id, title, track_producer_id;

-- If the above works, the issue is with the form data
-- If it fails, the issue is with RLS policies

-- Let's also check what the current RLS policies look like
SELECT 'Current RLS policies for tracks:' as info;
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY cmd, policyname;
