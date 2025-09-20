-- Test with a simple RLS policy to see if the issue is with the policy logic
-- This will help us determine if the problem is with authentication or policy complexity

-- Drop existing policies temporarily
DROP POLICY IF EXISTS "Producers can view custom sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Rights holders can view custom sync requests" ON custom_sync_requests;

-- Create a very simple policy that allows any authenticated user to see open requests
CREATE POLICY "Simple test policy" ON custom_sync_requests
    FOR SELECT USING (
        status = 'open' AND 
        end_date >= NOW() AND
        auth.uid() IS NOT NULL
    );

-- Verify the policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'custom_sync_requests'
ORDER BY policyname;

-- Test the query
SELECT COUNT(*) as open_requests_count 
FROM custom_sync_requests 
WHERE status = 'open' AND end_date >= NOW();

-- Test with explicit user ID
SELECT 
  csr.id,
  csr.status,
  csr.selected_rights_holder_id,
  csr.end_date,
  csr.project_title
FROM custom_sync_requests csr
WHERE csr.status = 'open' 
  AND csr.end_date >= NOW();
