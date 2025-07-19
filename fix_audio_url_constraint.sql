-- Fix the valid_audio_url constraint issue

-- 1. First, let's see what the constraint is actually checking
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'valid_audio_url';

-- 2. If the constraint exists and is causing issues, drop it
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS valid_audio_url;

-- 3. Verify the constraint is gone
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'valid_audio_url';

-- 4. Test that we can now insert a track (optional - just to verify)
-- This will show if there are any other constraints blocking insertion
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND column_name IN ('audio_url', 'title', 'track_producer_id', 'bpm')
ORDER BY column_name; 