-- Check Required Fields (NOT NULL)
SELECT 'Required fields in tracks table:' as info;
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND is_nullable = 'NO'
ORDER BY column_name;
