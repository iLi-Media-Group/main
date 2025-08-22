-- Fix RLS policies for background_assets table (causing 406 errors)
-- This script will properly configure RLS to allow authenticated users to read background assets

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for all users" ON background_assets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON background_assets;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON background_assets;
DROP POLICY IF EXISTS "Public read access for background assets" ON background_assets;
DROP POLICY IF EXISTS "Admin full access for background assets" ON background_assets;
DROP POLICY IF EXISTS "Authenticated users can insert background assets" ON background_assets;
DROP POLICY IF EXISTS "Authenticated users can update background assets" ON background_assets;
DROP POLICY IF EXISTS "Authenticated users can delete background assets" ON background_assets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON background_assets;

-- Drop any other policies that might exist
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'background_assets'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON background_assets', policy_record.policyname);
    END LOOP;
END $$;

-- Create proper RLS policies for background_assets
-- Allow all authenticated users to read background assets
CREATE POLICY "Enable read access for all users" ON background_assets
FOR SELECT USING (true);

-- Allow authenticated users to insert background assets
CREATE POLICY "Enable insert for authenticated users only" ON background_assets
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update background assets
CREATE POLICY "Enable update for authenticated users only" ON background_assets
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete background assets
CREATE POLICY "Enable delete for authenticated users only" ON background_assets
FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'background_assets';

-- Test the policies by checking if we can select from the table
SELECT COUNT(*) as background_assets_count FROM background_assets;
