-- Fix RLS for sync_proposal_history table
-- Based on the actual sync_proposals table structure

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
            AND (sp.client_id = auth.uid() OR sp.proposal_producer_id = auth.uid())
        )
    );

-- Users can insert history for proposals they're involved in
CREATE POLICY "sync_proposal_history_insert_policy" ON sync_proposal_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sync_proposals sp 
            WHERE sp.id = sync_proposal_history.proposal_id 
            AND (sp.client_id = auth.uid() OR sp.proposal_producer_id = auth.uid())
        )
    );

-- Users can update history for proposals they're involved in
CREATE POLICY "sync_proposal_history_update_policy" ON sync_proposal_history
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sync_proposals sp 
            WHERE sp.id = sync_proposal_history.proposal_id 
            AND (sp.client_id = auth.uid() OR sp.proposal_producer_id = auth.uid())
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM sync_proposals sp 
            WHERE sp.id = sync_proposal_history.proposal_id 
            AND (sp.client_id = auth.uid() OR sp.proposal_producer_id = auth.uid())
        )
    );

-- Users can delete history for proposals they're involved in
CREATE POLICY "sync_proposal_history_delete_policy" ON sync_proposal_history
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sync_proposals sp 
            WHERE sp.id = sync_proposal_history.proposal_id 
            AND (sp.client_id = auth.uid() OR sp.proposal_producer_id = auth.uid())
        )
    );

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'sync_proposal_history'; 