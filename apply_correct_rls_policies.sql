-- Apply the corrected RLS policies for custom_sync_requests table
-- Rights holders should work exactly like producers

-- Drop existing policies
DROP POLICY IF EXISTS "Producers and Rights Holders can view selected requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Producers and Rights Holders can view open requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Rights Holders can update selected requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Allow rights holders to view open requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Allow producers to view selected requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Allow rights holders to update selected requests" ON custom_sync_requests;

-- Create unified policy for both producers and rights holders
-- Logic:
-- 1. If specific producer selected → only that producer sees it
-- 2. If specific rights holder selected → only that rights holder sees it  
-- 3. If neither selected → all producers AND rights holders see it
CREATE POLICY "Custom sync requests visibility" ON custom_sync_requests
    FOR SELECT USING (
        (status = 'open' AND end_date >= NOW()) AND
        (
            -- Case 1: Specific producer selected - only that producer can see
            (selected_producer_id IS NOT NULL AND auth.uid() = selected_producer_id) OR
            -- Case 2: Specific rights holder selected - only that rights holder can see
            (selected_rights_holder_id IS NOT NULL AND auth.uid() = selected_rights_holder_id) OR
            -- Case 3: Neither selected - all producers and rights holders can see
            (selected_producer_id IS NULL AND selected_rights_holder_id IS NULL)
        )
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
