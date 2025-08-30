-- Fix the missing SELECT policy for rights holders
-- Run this directly in the Supabase SQL editor

-- Drop the overly permissive policy that might be causing conflicts
DROP POLICY IF EXISTS "Allow all authenticated users" ON custom_sync_requests;

-- Create specific policies for different user types

-- Policy for producers to view custom sync requests
CREATE POLICY "Producers can view custom sync requests" ON custom_sync_requests
    FOR SELECT USING (
        status = 'open' AND 
        end_date >= NOW() AND
        (auth.uid() = selected_producer_id OR selected_producer_id IS NULL)
    );

-- Policy for rights holders to view custom sync requests
CREATE POLICY "Rights holders can view custom sync requests" ON custom_sync_requests
    FOR SELECT USING (
        status = 'open' AND 
        end_date >= NOW() AND
        (auth.uid() = selected_rights_holder_id OR selected_rights_holder_id IS NULL)
    );

-- Check the result
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'custom_sync_requests' AND cmd = 'SELECT'
ORDER BY policyname;
