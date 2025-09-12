-- Fix RLS policies for tables that currently have RLS disabled
-- Based on actual table structures discovered

-- First, let's check the actual structure of sync_submission_favorites
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sync_submission_favorites' 
ORDER BY ordinal_position;

-- 1. sync_submission_favorites table
-- Enable RLS
ALTER TABLE sync_submission_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "sync_submission_favorites_select_policy" ON sync_submission_favorites;
DROP POLICY IF EXISTS "sync_submission_favorites_insert_policy" ON sync_submission_favorites;
DROP POLICY IF EXISTS "sync_submission_favorites_update_policy" ON sync_submission_favorites;
DROP POLICY IF EXISTS "sync_submission_favorites_delete_policy" ON sync_submission_favorites;

-- Create policies for sync_submission_favorites
-- Users can see their own favorites
CREATE POLICY "sync_submission_favorites_select_policy" ON sync_submission_favorites
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Users can insert their own favorites
CREATE POLICY "sync_submission_favorites_insert_policy" ON sync_submission_favorites
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- Users can update their own favorites
CREATE POLICY "sync_submission_favorites_update_policy" ON sync_submission_favorites
    FOR UPDATE USING (
        user_id = auth.uid()
    ) WITH CHECK (
        user_id = auth.uid()
    );

-- Users can delete their own favorites
CREATE POLICY "sync_submission_favorites_delete_policy" ON sync_submission_favorites
    FOR DELETE USING (
        user_id = auth.uid()
    );

-- 2. sync_request_messages table (using correct column names)
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
        ) OR producer_id = auth.uid()
    );

-- Users can insert messages for requests they're involved in
CREATE POLICY "sync_request_messages_insert_policy" ON sync_request_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM custom_sync_requests csr 
            WHERE csr.id = sync_request_messages.sync_request_id 
            AND (csr.client_id = auth.uid() OR csr.preferred_producer_id = auth.uid())
        ) OR producer_id = auth.uid()
    );

-- Users can update their own messages
CREATE POLICY "sync_request_messages_update_policy" ON sync_request_messages
    FOR UPDATE USING (
        producer_id = auth.uid()
    ) WITH CHECK (
        producer_id = auth.uid()
    );

-- Users can delete their own messages
CREATE POLICY "sync_request_messages_delete_policy" ON sync_request_messages
    FOR DELETE USING (
        producer_id = auth.uid()
    );

-- 3. sync_submissions table
-- Enable RLS
ALTER TABLE sync_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "sync_submissions_select_policy" ON sync_submissions;
DROP POLICY IF EXISTS "sync_submissions_insert_policy" ON sync_submissions;
DROP POLICY IF EXISTS "sync_submissions_update_policy" ON sync_submissions;
DROP POLICY IF EXISTS "sync_submissions_delete_policy" ON sync_submissions;

-- Create policies for sync_submissions
-- Users can see submissions they're involved in (as client or producer)
CREATE POLICY "sync_submissions_select_policy" ON sync_submissions
    FOR SELECT USING (
        client_id = auth.uid() OR producer_id = auth.uid()
    );

-- Users can insert submissions where they are the client
CREATE POLICY "sync_submissions_insert_policy" ON sync_submissions
    FOR INSERT WITH CHECK (
        client_id = auth.uid()
    );

-- Users can update submissions they're involved in
CREATE POLICY "sync_submissions_update_policy" ON sync_submissions
    FOR UPDATE USING (
        client_id = auth.uid() OR producer_id = auth.uid()
    ) WITH CHECK (
        client_id = auth.uid() OR producer_id = auth.uid()
    );

-- Users can delete submissions they're involved in
CREATE POLICY "sync_submissions_delete_policy" ON sync_submissions
    FOR DELETE USING (
        client_id = auth.uid() OR producer_id = auth.uid()
    );

-- 4. white_label_monthly table
-- Enable RLS
ALTER TABLE white_label_monthly ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "white_label_monthly_select_policy" ON white_label_monthly;
DROP POLICY IF EXISTS "white_label_monthly_insert_policy" ON white_label_monthly;
DROP POLICY IF EXISTS "white_label_monthly_update_policy" ON white_label_monthly;
DROP POLICY IF EXISTS "white_label_monthly_delete_policy" ON white_label_monthly;

-- Create policies for white_label_monthly
-- Users can only see their own white label data
CREATE POLICY "white_label_monthly_select_policy" ON white_label_monthly
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Users can insert their own white label data
CREATE POLICY "white_label_monthly_insert_policy" ON white_label_monthly
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- Users can update their own white label data
CREATE POLICY "white_label_monthly_update_policy" ON white_label_monthly
    FOR UPDATE USING (
        user_id = auth.uid()
    ) WITH CHECK (
        user_id = auth.uid()
    );

-- Users can delete their own white label data
CREATE POLICY "white_label_monthly_delete_policy" ON white_label_monthly
    FOR DELETE USING (
        user_id = auth.uid()
    );

-- 5. sync_proposal_history table
-- Enable RLS
ALTER TABLE sync_proposal_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "sync_proposal_history_select_policy" ON sync_proposal_history;
DROP POLICY IF EXISTS "sync_proposal_history_insert_policy" ON sync_proposal_history;
DROP POLICY IF EXISTS "sync_proposal_history_update_policy" ON sync_proposal_history;
DROP POLICY IF EXISTS "sync_proposal_history_delete_policy" ON sync_proposal_history;

-- Create policies for sync_proposal_history
-- Users can see history for proposals they're involved in (as client or producer)
CREATE POLICY "sync_proposal_history_select_policy" ON sync_proposal_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sync_proposals sp 
            WHERE sp.id = sync_proposal_history.proposal_id 
            AND (sp.client_id = auth.uid() OR sp.producer_id = auth.uid())
        )
    );

-- Users can insert history for proposals they're involved in
CREATE POLICY "sync_proposal_history_insert_policy" ON sync_proposal_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sync_proposals sp 
            WHERE sp.id = sync_proposal_history.proposal_id 
            AND (sp.client_id = auth.uid() OR sp.producer_id = auth.uid())
        )
    );

-- Users can update history for proposals they're involved in
CREATE POLICY "sync_proposal_history_update_policy" ON sync_proposal_history
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sync_proposals sp 
            WHERE sp.id = sync_proposal_history.proposal_id 
            AND (sp.client_id = auth.uid() OR sp.producer_id = auth.uid())
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM sync_proposals sp 
            WHERE sp.id = sync_proposal_history.proposal_id 
            AND (sp.client_id = auth.uid() OR sp.producer_id = auth.uid())
        )
    );

-- Users can delete history for proposals they're involved in
CREATE POLICY "sync_proposal_history_delete_policy" ON sync_proposal_history
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sync_proposals sp 
            WHERE sp.id = sync_proposal_history.proposal_id 
            AND (sp.client_id = auth.uid() OR sp.producer_id = auth.uid())
        )
    );

-- Fix RLS policy to match the exact query logic from Rights Holder Dashboard
-- The dashboard uses: .or(`selected_rights_holder_id.eq.${user.id},selected_rights_holder_id.is.null`)

-- Drop existing policies
DROP POLICY IF EXISTS "Custom sync requests visibility" ON custom_sync_requests;
DROP POLICY IF EXISTS "Allow rights holders to update selected requests" ON custom_sync_requests;

-- Create simple policy that matches the dashboard query exactly
CREATE POLICY "Rights holders can view custom sync requests" ON custom_sync_requests
    FOR SELECT USING (
        status = 'open' AND 
        end_date >= NOW() AND
        (auth.uid() = selected_rights_holder_id OR selected_rights_holder_id IS NULL)
    );

-- Create policy for producers (similar logic)
CREATE POLICY "Producers can view custom sync requests" ON custom_sync_requests
    FOR SELECT USING (
        status = 'open' AND 
        end_date >= NOW() AND
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

-- Test the exact query that should work now
SELECT COUNT(*) as open_requests_count 
FROM custom_sync_requests 
WHERE status = 'open' AND end_date >= NOW();

-- Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN (
    'sync_proposal_history', 
    'sync_request_messages',
    'sync_submission_favorites',
    'sync_submissions',
    'white_label_monthly'
)
ORDER BY tablename; 