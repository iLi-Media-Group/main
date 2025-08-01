-- Fix RLS for report_settings table
-- Based on the actual table structure

-- Enable RLS
ALTER TABLE report_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "report_settings_select_policy" ON report_settings;
DROP POLICY IF EXISTS "report_settings_insert_policy" ON report_settings;
DROP POLICY IF EXISTS "report_settings_update_policy" ON report_settings;
DROP POLICY IF EXISTS "report_settings_delete_policy" ON report_settings;

-- Create policies for report_settings
-- Allow all authenticated users to read report settings (they're global)
CREATE POLICY "report_settings_select_policy" ON report_settings
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

-- Only admin users can insert report settings
CREATE POLICY "report_settings_insert_policy" ON report_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (account_type = 'admin' OR account_type LIKE '%admin%')
        )
    );

-- Only admin users can update report settings
CREATE POLICY "report_settings_update_policy" ON report_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (account_type = 'admin' OR account_type LIKE '%admin%')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (account_type = 'admin' OR account_type LIKE '%admin%')
        )
    );

-- Only admin users can delete report settings
CREATE POLICY "report_settings_delete_policy" ON report_settings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (account_type = 'admin' OR account_type LIKE '%admin%')
        )
    );

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'report_settings'; 