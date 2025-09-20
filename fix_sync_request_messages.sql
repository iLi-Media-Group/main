-- Fix RLS for sync_request_messages table
-- Based on the actual table structure

-- Enable RLS
ALTER TABLE sync_request_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "sync_request_messages_select_policy" ON sync_request_messages;
DROP POLICY IF EXISTS "sync_request_messages_insert_policy" ON sync_request_messages;
DROP POLICY IF EXISTS "sync_request_messages_update_policy" ON sync_request_messages;
DROP POLICY IF EXISTS "sync_request_messages_delete_policy" ON sync_request_messages;

-- Create policies for sync_request_messages
-- Users can see messages for requests they're involved in
CREATE POLICY "sync_request_messages_select_policy" ON sync_request_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM custom_sync_requests csr 
            WHERE csr.id = sync_request_messages.sync_request_id 
            AND (csr.client_id = auth.uid() OR csr.preferred_producer_id = auth.uid())
        ) OR sender_id = auth.uid()
    );

-- Users can insert messages for requests they're involved in
CREATE POLICY "sync_request_messages_insert_policy" ON sync_request_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM custom_sync_requests csr 
            WHERE csr.id = sync_request_messages.sync_request_id 
            AND (csr.client_id = auth.uid() OR csr.preferred_producer_id = auth.uid())
        ) OR sender_id = auth.uid()
    );

-- Users can update their own messages
CREATE POLICY "sync_request_messages_update_policy" ON sync_request_messages
    FOR UPDATE USING (
        sender_id = auth.uid()
    ) WITH CHECK (
        sender_id = auth.uid()
    );

-- Users can delete their own messages
CREATE POLICY "sync_request_messages_delete_policy" ON sync_request_messages
    FOR DELETE USING (
        sender_id = auth.uid()
    );

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'sync_request_messages'; 