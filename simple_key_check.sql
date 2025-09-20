-- Simple Key Field Check

-- Check the constraint definition
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'tracks_key_check';

-- Check what values are currently in the key field
SELECT DISTINCT key FROM tracks WHERE key IS NOT NULL ORDER BY key LIMIT 10;

-- Check the data type
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tracks' AND column_name = 'key';
