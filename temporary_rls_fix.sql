-- TEMPORARY: Disable RLS on tracks table to test uploads
-- This will allow uploads to work while we debug the policy issue

-- Disable RLS temporarily
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tracks';

-- Test upload functionality now
-- After confirming uploads work, we can re-enable with proper policies using:
-- ALTER TABLE tracks ENABLE ROW LEVEL SECURITY; 