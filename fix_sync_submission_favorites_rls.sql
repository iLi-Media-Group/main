-- Fix RLS policies for sync_submission_favorites table
-- This ensures the favorites system works correctly

-- Enable RLS on sync_submission_favorites table
ALTER TABLE sync_submission_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "sync_submission_favorites_select_policy" ON sync_submission_favorites;
DROP POLICY IF EXISTS "sync_submission_favorites_insert_policy" ON sync_submission_favorites;
DROP POLICY IF EXISTS "sync_submission_favorites_update_policy" ON sync_submission_favorites;
DROP POLICY IF EXISTS "sync_submission_favorites_delete_policy" ON sync_submission_favorites;

-- Create correct policies using client_id (not user_id)
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

-- Grant necessary permissions
GRANT ALL ON sync_submission_favorites TO authenticated;

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sync_submission_favorites' 
ORDER BY ordinal_position;
