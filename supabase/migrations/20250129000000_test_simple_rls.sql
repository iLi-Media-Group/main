-- Test with a simple RLS policy to see if the issue is with the policy logic
-- This will help us determine if the problem is with authentication or policy complexity

-- Drop existing policies temporarily
DROP POLICY IF EXISTS "Producers can view custom sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Rights holders can view custom sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Rights holders can update selected requests" ON custom_sync_requests;

-- Create a very simple policy that allows any authenticated user to see open requests
CREATE POLICY "Simple test policy" ON custom_sync_requests
    FOR SELECT USING (
        status = 'open' AND 
        end_date >= NOW() AND
        auth.uid() IS NOT NULL
    );

-- Also create a simple update policy
CREATE POLICY "Simple update policy" ON custom_sync_requests
    FOR UPDATE USING (
        auth.uid() IS NOT NULL
    );
