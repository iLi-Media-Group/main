-- Test if RLS is the issue by temporarily disabling it
-- This will help us determine if the problem is with RLS or something else

-- Check if RLS is enabled on the table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'custom_sync_requests';

-- Temporarily disable RLS to test
ALTER TABLE custom_sync_requests DISABLE ROW LEVEL SECURITY;

-- Test the query without RLS
SELECT 
  csr.id,
  csr.status,
  csr.selected_rights_holder_id,
  csr.end_date,
  csr.project_title
FROM custom_sync_requests csr
WHERE csr.status = 'open' 
  AND csr.end_date >= NOW();

-- Re-enable RLS
ALTER TABLE custom_sync_requests ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Producers can view custom sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Rights holders can view custom sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Rights holders can update selected requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Simple test policy" ON custom_sync_requests;
DROP POLICY IF EXISTS "Simple update policy" ON custom_sync_requests;

-- Create a completely permissive policy for testing
CREATE POLICY "Allow all authenticated users" ON custom_sync_requests
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Verify the policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'custom_sync_requests'
ORDER BY policyname;
