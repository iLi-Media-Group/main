-- Fix RLS policies for custom_sync_requests table
-- The issue is that the policies are using 'preferred_rights_holder_id' which doesn't exist
-- We need to use 'selected_rights_holder_id' instead

-- Drop the incorrect policies
DROP POLICY IF EXISTS "Producers and Rights Holders can view selected requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Producers and Rights Holders can view open requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Rights Holders can update selected requests" ON custom_sync_requests;

-- Create correct policies using the actual column names
CREATE POLICY "Producers and Rights Holders can view selected requests" ON custom_sync_requests
    FOR SELECT USING (
        auth.uid() = selected_producer_id OR 
        auth.uid() = selected_rights_holder_id
    );

CREATE POLICY "Producers and Rights Holders can view open requests" ON custom_sync_requests
    FOR SELECT USING (
        status = 'open' AND 
        end_date >= NOW()
    );

-- Add policy for rights holders to update requests where they are the selected rights holder
CREATE POLICY "Rights Holders can update selected requests" ON custom_sync_requests
    FOR UPDATE USING (auth.uid() = selected_rights_holder_id);

-- Verify the policies are created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'custom_sync_requests';

-- Test the query that should work now
SELECT COUNT(*) as open_requests_count 
FROM custom_sync_requests 
WHERE status = 'open' AND end_date >= NOW();
