-- Check Key Field Constraint
-- This will show us what values are allowed for the 'key' field

SELECT 'Checking key field constraint:' as info;

-- Check the constraint definition
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'tracks_key_check';

-- Check what values are currently in the key field
SELECT 'Current key values in tracks:' as info;
SELECT DISTINCT key FROM tracks WHERE key IS NOT NULL ORDER BY key;

-- Check the data type of the key field
SELECT 'Key field data type:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' AND column_name = 'key';

-- Let's try a different key value that might be valid
SELECT 'Testing with different key values:' as info;

-- Try with a valid key (based on common music keys)
UPDATE tracks 
SET key = 'C Major' 
WHERE id = '31b26710-785a-4573-b1a0-1ecfff42dd46';

-- Check if that worked
SELECT id, title, key FROM tracks WHERE id = '31b26710-785a-4573-b1a0-1ecfff42dd46';

-- Clean up - delete the test track
DELETE FROM tracks WHERE id = '31b26710-785a-4573-b1a0-1ecfff42dd46';
