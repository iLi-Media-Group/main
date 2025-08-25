-- Fix RLS for white_label_monthly_payments table
-- Based on the actual table structure

-- Enable RLS
ALTER TABLE white_label_monthly_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "white_label_monthly_payments_select_policy" ON white_label_monthly_payments;
DROP POLICY IF EXISTS "white_label_monthly_payments_insert_policy" ON white_label_monthly_payments;
DROP POLICY IF EXISTS "white_label_monthly_payments_update_policy" ON white_label_monthly_payments;
DROP POLICY IF EXISTS "white_label_monthly_payments_delete_policy" ON white_label_monthly_payments;

-- Create policies for white_label_monthly_payments
-- Users can see their own payments
CREATE POLICY "white_label_monthly_payments_select_policy" ON white_label_monthly_payments
    FOR SELECT USING (
        client_id = auth.uid()
    );

-- Users can insert their own payments
CREATE POLICY "white_label_monthly_payments_insert_policy" ON white_label_monthly_payments
    FOR INSERT WITH CHECK (
        client_id = auth.uid()
    );

-- Users can update their own payments
CREATE POLICY "white_label_monthly_payments_update_policy" ON white_label_monthly_payments
    FOR UPDATE USING (
        client_id = auth.uid()
    ) WITH CHECK (
        client_id = auth.uid()
    );

-- Users can delete their own payments
CREATE POLICY "white_label_monthly_payments_delete_policy" ON white_label_monthly_payments
    FOR DELETE USING (
        client_id = auth.uid()
    );

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'white_label_monthly_payments'; 