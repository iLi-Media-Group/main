-- Check and fix remaining constraints on tracks table

-- 1. Check the tracks table structure for all fields
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND column_name IN ('duration', 'key', 'vocals_usage_type', 'bpm')
ORDER BY column_name;

-- 2. Check what the validate_duration_format function does
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'validate_duration_format';

-- 3. Test the duration validation function with some values
-- SELECT validate_duration_format('3:45');
-- SELECT validate_duration_format('0:30');
-- SELECT validate_duration_format(NULL);

-- 4. If the duration constraint is causing issues, we can drop it
-- ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_duration_check;

-- 5. Check if there are any tracks in the database to see the current data format
SELECT 
  id,
  title,
  duration,
  key,
  vocals_usage_type,
  bpm
FROM tracks 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Show all check constraints again to confirm what's left
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tracks'::regclass
  AND contype = 'c'  -- check constraints only
ORDER BY conname; 