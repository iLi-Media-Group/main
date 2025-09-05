-- Test Minimal Track Insert
-- This will help us identify which field is causing the 400 error

-- Test with absolute minimal data
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
  'MINIMAL TEST TRACK',
  'Test Artist',
  ARRAY['test'],
  ARRAY['test'],
  ARRAY['test'],
  ARRAY['test'],
  ARRAY['test'],
  120,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false
) RETURNING id, title;

-- Clean up
DELETE FROM tracks WHERE title = 'MINIMAL TEST TRACK';
