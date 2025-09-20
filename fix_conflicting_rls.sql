-- Fix conflicting RLS policies for custom_sync_requests table
-- Remove overly permissive policies that conflict with specific ones

-- Drop the overly permissive policies that are causing conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON custom_sync_requests;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON custom_sync_requests;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON custom_sync_requests;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON custom_sync_requests;

-- Keep the specific policies that are working correctly
-- The "Custom sync requests visibility" policy should now work properly

-- Verify the remaining policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'custom_sync_requests'
ORDER BY policyname;

-- Test the query that should now work
SELECT COUNT(*) as open_requests_count 
FROM custom_sync_requests 
WHERE status = 'open' AND end_date >= NOW();
