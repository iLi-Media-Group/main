-- Fix RLS policies for rights_holders table (causing 406 errors)
-- This script will properly configure RLS to allow authenticated users to read their own rights holder data

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for all users" ON rights_holders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON rights_holders;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON rights_holders;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON rights_holders;
DROP POLICY IF EXISTS "Public read access for rights holders" ON rights_holders;
DROP POLICY IF EXISTS "Admin full access for rights holders" ON rights_holders;
DROP POLICY IF EXISTS "Authenticated users can insert rights holders" ON rights_holders;
DROP POLICY IF EXISTS "Authenticated users can update rights holders" ON rights_holders;
DROP POLICY IF EXISTS "Authenticated users can delete rights holders" ON rights_holders;
DROP POLICY IF EXISTS "Rights holders can insert own data" ON rights_holders;
DROP POLICY IF EXISTS "Rights holders can update own data" ON rights_holders;
DROP POLICY IF EXISTS "Rights holders can view own data" ON rights_holders;

-- Drop any other policies that might exist
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'rights_holders'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON rights_holders', policy_record.policyname);
    END LOOP;
END $$;

-- Create proper RLS policies for rights_holders
-- Allow users to read their own rights holder data (using 'id' column)
CREATE POLICY "Rights holders can view own data" ON rights_holders
FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to insert their own rights holder data
CREATE POLICY "Rights holders can insert own data" ON rights_holders
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own rights holder data
CREATE POLICY "Rights holders can update own data" ON rights_holders
FOR UPDATE USING (auth.uid() = id);

-- Allow users to delete their own rights holder data
CREATE POLICY "Rights holders can delete own data" ON rights_holders
FOR DELETE USING (auth.uid() = id);

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
WHERE tablename = 'rights_holders';

-- Test the policies by checking if we can select from the table
SELECT COUNT(*) as rights_holders_count FROM rights_holders;
