-- Check Tracks Table Schema
-- This will help us understand what fields are required and their types

SELECT 'Tracks table schema:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'tracks' 
ORDER BY ordinal_position;

-- Check for any NOT NULL constraints
SELECT 'NOT NULL columns:' as info;
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND is_nullable = 'NO'
ORDER BY column_name;

-- Check for any check constraints
SELECT 'Check constraints on tracks:' as info;
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tracks'::regclass
  AND contype = 'c';
