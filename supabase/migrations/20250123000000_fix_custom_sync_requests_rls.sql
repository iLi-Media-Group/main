-- Fix RLS policies for custom_sync_requests table
-- This allows rights holders to see open custom sync requests

-- Drop existing policies
DROP POLICY IF EXISTS "Producers and Rights Holders can view selected requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Producers and Rights Holders can view open requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Rights Holders can update selected requests" ON custom_sync_requests;

-- Create a simpler policy that allows rights holders to see all open requests
CREATE POLICY "Allow rights holders to view open requests" ON custom_sync_requests
    FOR SELECT USING (
        status = 'open' AND 
        end_date >= NOW()
    );

-- Create policy for producers to see their selected requests
CREATE POLICY "Allow producers to view selected requests" ON custom_sync_requests
    FOR SELECT USING (
        auth.uid() = selected_producer_id
    );

-- Create policy for rights holders to update requests where they are selected
CREATE POLICY "Allow rights holders to update selected requests" ON custom_sync_requests
    FOR UPDATE USING (
        auth.uid() = selected_rights_holder_id
    );
