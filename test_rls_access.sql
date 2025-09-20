-- Test RLS access to tracks table

-- Check if RLS is enabled
SELECT 'RLS status on tracks table:' as test;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tracks';

-- Check current RLS policies
SELECT 'Current RLS policies:' as test;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY policyname;

-- Test basic query as authenticated user (simulate frontend)
SELECT 'Testing tracks query:' as test;
SELECT COUNT(*) as accessible_tracks FROM tracks;

-- Test with specific search terms
SELECT 'Testing "Soul" search:' as test;
SELECT COUNT(*) as soul_tracks FROM tracks WHERE sub_genres LIKE '%Soul%';

-- Test with "Hip-Hop" search
SELECT 'Testing "Hip-Hop" search:' as test;
SELECT COUNT(*) as hiphop_tracks FROM tracks WHERE genres LIKE '%Hip-Hop%';
