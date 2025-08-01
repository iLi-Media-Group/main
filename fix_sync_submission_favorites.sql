-- Fix RLS for sync_submission_favorites table
-- Based on the actual table structure

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

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'sync_submission_favorites'; 