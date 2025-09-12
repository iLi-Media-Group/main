-- Fix RLS policies for tables that currently have RLS disabled
-- This script adds appropriate RLS policies for security

-- 1. sales_analytics table (Materialized View)
-- Note: Materialized views don't support RLS directly
-- Security should be handled at the source table level
-- This materialized view should be refreshed with proper user filtering
-- Consider adding a WHERE clause to the materialized view definition
-- or handle security through the underlying tables

-- For now, we'll skip RLS on this materialized view
-- and focus on securing the underlying tables instead

-- 2. sync_proposal_history table
-- Enable RLS
ALTER TABLE sync_proposal_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "sync_proposal_history_select_policy" ON sync_proposal_history;
DROP POLICY IF EXISTS "sync_proposal_history_insert_policy" ON sync_proposal_history;
DROP POLICY IF EXISTS "sync_proposal_history_update_policy" ON sync_proposal_history;
DROP POLICY IF EXISTS "sync_proposal_history_delete_policy" ON sync_proposal_history;

-- Create policies for sync_proposal_history
-- Users can see history for proposals they're involved in (as client or producer)
-- First check if producer_id column exists in sync_proposals
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sync_proposals' AND column_name = 'producer_id'
    ) THEN
        -- Create policy with producer_id
        EXECUTE 'CREATE POLICY "sync_proposal_history_select_policy" ON sync_proposal_history
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM sync_proposals sp 
                    WHERE sp.id = sync_proposal_history.proposal_id 
                    AND (sp.client_id = auth.uid() OR sp.producer_id = auth.uid())
                )
            )';
    ELSE
        -- Create policy without producer_id (fallback)
        EXECUTE 'CREATE POLICY "sync_proposal_history_select_policy" ON sync_proposal_history
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM sync_proposals sp 
                    WHERE sp.id = sync_proposal_history.proposal_id 
                    AND sp.client_id = auth.uid()
                )
            )';
    END IF;
END $$;

-- Users can insert history for proposals they're involved in
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sync_proposals' AND column_name = 'producer_id'
    ) THEN
        EXECUTE 'CREATE POLICY "sync_proposal_history_insert_policy" ON sync_proposal_history
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM sync_proposals sp 
                    WHERE sp.id = sync_proposal_history.proposal_id 
                    AND (sp.client_id = auth.uid() OR sp.producer_id = auth.uid())
                )
            )';
    ELSE
        EXECUTE 'CREATE POLICY "sync_proposal_history_insert_policy" ON sync_proposal_history
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM sync_proposals sp 
                    WHERE sp.id = sync_proposal_history.proposal_id 
                    AND sp.client_id = auth.uid()
                )
            )';
    END IF;
END $$;

-- Users can update history for proposals they're involved in
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sync_proposals' AND column_name = 'producer_id'
    ) THEN
        EXECUTE 'CREATE POLICY "sync_proposal_history_update_policy" ON sync_proposal_history
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
            )';
    ELSE
        EXECUTE 'CREATE POLICY "sync_proposal_history_update_policy" ON sync_proposal_history
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM sync_proposals sp 
                    WHERE sp.id = sync_proposal_history.proposal_id 
                    AND sp.client_id = auth.uid()
                )
            ) WITH CHECK (
                EXISTS (
                    SELECT 1 FROM sync_proposals sp 
                    WHERE sp.id = sync_proposal_history.proposal_id 
                    AND sp.client_id = auth.uid()
                )
            )';
    END IF;
END $$;

-- Users can delete history for proposals they're involved in
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sync_proposals' AND column_name = 'producer_id'
    ) THEN
        EXECUTE 'CREATE POLICY "sync_proposal_history_delete_policy" ON sync_proposal_history
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM sync_proposals sp 
                    WHERE sp.id = sync_proposal_history.proposal_id 
                    AND (sp.client_id = auth.uid() OR sp.producer_id = auth.uid())
                )
            )';
    ELSE
        EXECUTE 'CREATE POLICY "sync_proposal_history_delete_policy" ON sync_proposal_history
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM sync_proposals sp 
                    WHERE sp.id = sync_proposal_history.proposal_id 
                    AND sp.client_id = auth.uid()
                )
            )';
    END IF;
END $$;

-- 3. sync_request_messages table
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
            WHERE csr.id = sync_request_messages.request_id 
            AND (csr.client_id = auth.uid() OR csr.preferred_producer_id = auth.uid())
        )
    );

-- Users can insert messages for requests they're involved in
CREATE POLICY "sync_request_messages_insert_policy" ON sync_request_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM custom_sync_requests csr 
            WHERE csr.id = sync_request_messages.request_id 
            AND (csr.client_id = auth.uid() OR csr.preferred_producer_id = auth.uid())
        )
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

-- 4. sync_submission_favorites table
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

-- 5. sync_submissions table
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

-- 6. white_label_monthly table
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

-- Verify RLS is enabled on all tables (excluding materialized views)
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

-- Check if custom_sync_requests table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'custom_sync_requests' 
ORDER BY ordinal_position;

-- Check if sales_analytics is a materialized view
SELECT 
    schemaname,
    matviewname as tablename,
    'materialized_view' as type
FROM pg_matviews 
WHERE matviewname = 'sales_analytics';

-- Check the structure of sync_proposals table to debug the column issue
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sync_proposals' 
ORDER BY ordinal_position; 