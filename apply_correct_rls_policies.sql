-- Apply the corrected RLS policies for custom_sync_requests table
-- Rights holders should work exactly like producers

-- Drop existing policies
DROP POLICY IF EXISTS "Producers and Rights Holders can view selected requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Producers and Rights Holders can view open requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Rights Holders can update selected requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Allow rights holders to view open requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Allow producers to view selected requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Allow rights holders to update selected requests" ON custom_sync_requests;

-- Create policy for rights holders to see requests that are either:
-- 1. Specifically assigned to them, OR
-- 2. Open to all rights holders (no specific rights holder selected)
CREATE POLICY "Rights holders can view relevant requests" ON custom_sync_requests
    FOR SELECT USING (
        (status = 'open' AND end_date >= NOW()) AND
        (auth.uid() = selected_rights_holder_id OR selected_rights_holder_id IS NULL)
    );

-- Create policy for producers to see requests that are either:
-- 1. Specifically assigned to them, OR  
-- 2. Open to all producers (no specific producer selected)
CREATE POLICY "Producers can view relevant requests" ON custom_sync_requests
    FOR SELECT USING (
        (status = 'open' AND end_date >= NOW()) AND
        (auth.uid() = selected_producer_id OR selected_producer_id IS NULL)
    );

-- Create policy for rights holders to update requests where they are selected
CREATE POLICY "Rights holders can update selected requests" ON custom_sync_requests
    FOR UPDATE USING (
        auth.uid() = selected_rights_holder_id
    );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'custom_sync_requests';

-- Test the query that should now work
SELECT COUNT(*) as open_requests_count 
FROM custom_sync_requests 
WHERE status = 'open' AND end_date >= NOW();
