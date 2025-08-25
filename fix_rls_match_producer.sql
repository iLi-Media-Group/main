-- Fix RLS policies to match exactly what works for the Producer Dashboard
-- Since the Producer Dashboard is working, let's replicate that logic

-- Drop the complex policy
DROP POLICY IF EXISTS "Custom sync requests visibility" ON custom_sync_requests;

-- Create simple policies that match the working producer logic
-- Producer Dashboard uses: .or(`selected_producer_id.eq.${user.id},selected_producer_id.is.null`)

-- Policy for producers (this is working)
CREATE POLICY "Producers can view custom sync requests" ON custom_sync_requests
    FOR SELECT USING (
        status = 'open' AND 
        end_date >= NOW() AND
        (auth.uid() = selected_producer_id OR selected_producer_id IS NULL)
    );

-- Policy for rights holders (same logic, different column)
CREATE POLICY "Rights holders can view custom sync requests" ON custom_sync_requests
    FOR SELECT USING (
        status = 'open' AND 
        end_date >= NOW() AND
        (auth.uid() = selected_rights_holder_id OR selected_rights_holder_id IS NULL)
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
