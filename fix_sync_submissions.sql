-- Fix RLS for sync_submissions table
-- Based on the actual table structure

-- Enable RLS
ALTER TABLE sync_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "sync_submissions_select_policy" ON sync_submissions;
DROP POLICY IF EXISTS "sync_submissions_insert_policy" ON sync_submissions;
DROP POLICY IF EXISTS "sync_submissions_update_policy" ON sync_submissions;
DROP POLICY IF EXISTS "sync_submissions_delete_policy" ON sync_submissions;

-- Create policies for sync_submissions
-- Users can see submissions for requests they're involved in
CREATE POLICY "sync_submissions_select_policy" ON sync_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM custom_sync_requests csr 
            WHERE csr.id = sync_submissions.sync_request_id 
            AND (csr.client_id = auth.uid() OR csr.preferred_producer_id = auth.uid())
        ) OR producer_id = auth.uid()
    );

-- Producers can insert submissions for requests they're assigned to
CREATE POLICY "sync_submissions_insert_policy" ON sync_submissions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM custom_sync_requests csr 
            WHERE csr.id = sync_submissions.sync_request_id 
            AND csr.preferred_producer_id = auth.uid()
        ) AND producer_id = auth.uid()
    );

-- Producers can update their own submissions
CREATE POLICY "sync_submissions_update_policy" ON sync_submissions
    FOR UPDATE USING (
        producer_id = auth.uid()
    ) WITH CHECK (
        producer_id = auth.uid()
    );

-- Producers can delete their own submissions
CREATE POLICY "sync_submissions_delete_policy" ON sync_submissions
    FOR DELETE USING (
        producer_id = auth.uid()
    );

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'sync_submissions'; 