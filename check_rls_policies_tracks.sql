-- Check RLS policies on tracks table
SELECT 'RLS enabled on tracks table:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tracks';

-- Check existing RLS policies
SELECT 'Current RLS policies on tracks:' as info;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tracks';

-- Check if tracks table exists and has data
SELECT 'Tracks table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tracks'
ORDER BY ordinal_position;

-- Test basic query without RLS
SELECT 'Testing basic tracks query:' as info;
SELECT COUNT(*) as track_count FROM tracks;
