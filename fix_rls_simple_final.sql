-- Create a simple RLS policy that exactly matches the Rights Holder Dashboard query
-- The dashboard uses: .or(`selected_rights_holder_id.eq.${user.id},selected_rights_holder_id.is.null`)

-- Drop the complex policy
DROP POLICY IF EXISTS "Custom sync requests visibility" ON custom_sync_requests;

-- Create simple policy that matches the dashboard query exactly
CREATE POLICY "Simple custom sync requests visibility" ON custom_sync_requests
    FOR SELECT USING (
        status = 'open' AND 
        end_date >= NOW() AND
        (auth.uid() = selected_rights_holder_id OR selected_rights_holder_id IS NULL)
    );

-- Also create a policy for producers
CREATE POLICY "Producers can view custom sync requests" ON custom_sync_requests
    FOR SELECT USING (
        status = 'open' AND 
        end_date >= NOW() AND
        (auth.uid() = selected_producer_id OR selected_producer_id IS NULL)
    );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'custom_sync_requests'
ORDER BY policyname;

-- Test the query that should now work
SELECT COUNT(*) as open_requests_count 
FROM custom_sync_requests 
WHERE status = 'open' AND end_date >= NOW();
