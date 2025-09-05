-- Comprehensive RLS fix script - check all table structures first, then apply policies

-- First, let's check the structure of all tables we need to fix
-- 1. sync_submission_favorites table structure
SELECT 'sync_submission_favorites' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sync_submission_favorites' 
ORDER BY ordinal_position;

-- 2. sync_request_messages table structure
SELECT 'sync_request_messages' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sync_request_messages' 
ORDER BY ordinal_position;

-- 3. sync_submissions table structure
SELECT 'sync_submissions' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sync_submissions' 
ORDER BY ordinal_position;

-- 4. white_label_monthly table structure
SELECT 'white_label_monthly' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'white_label_monthly' 
ORDER BY ordinal_position;

-- 5. sync_proposal_history table structure
SELECT 'sync_proposal_history' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sync_proposal_history' 
ORDER BY ordinal_position;

-- Now apply RLS policies based on actual table structures

-- 1. sync_submission_favorites table (using client_id instead of user_id)
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
        client_id = auth.uid()
    );

-- Users can insert their own favorites
CREATE POLICY "sync_submission_favorites_insert_policy" ON sync_submission_favorites
    FOR INSERT WITH CHECK (
        client_id = auth.uid()
    );

-- Users can update their own favorites
CREATE POLICY "sync_submission_favorites_update_policy" ON sync_submission_favorites
    FOR UPDATE USING (
        client_id = auth.uid()
    ) WITH CHECK (
        client_id = auth.uid()
    );

-- Users can delete their own favorites
CREATE POLICY "sync_submission_favorites_delete_policy" ON sync_submission_favorites
    FOR DELETE USING (
        client_id = auth.uid()
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