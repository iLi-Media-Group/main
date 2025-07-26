-- Fix RLS policies for discounts table to allow admin access

-- First, enable RLS on the discounts table if not already enabled
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON discounts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON discounts;
DROP POLICY IF EXISTS "Enable update for users based on email" ON discounts;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON discounts;
DROP POLICY IF EXISTS "Enable all access for admins" ON discounts;

-- Create comprehensive RLS policies for discounts table

-- 1. Allow all authenticated users to read active discounts
CREATE POLICY "Enable read access for all users" ON discounts
    FOR SELECT
    USING (is_active = true);

-- 2. Allow admin users to read all discounts (including inactive ones)
CREATE POLICY "Enable read access for admins" ON discounts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'admin,producer'
                OR profiles.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
            )
        )
    );

-- 3. Allow admin users to insert discounts
CREATE POLICY "Enable insert for admins" ON discounts
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'admin,producer'
                OR profiles.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
            )
        )
    );

-- 4. Allow admin users to update discounts
CREATE POLICY "Enable update for admins" ON discounts
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'admin,producer'
                OR profiles.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'admin,producer'
                OR profiles.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
            )
        )
    );

-- 5. Allow admin users to delete discounts
CREATE POLICY "Enable delete for admins" ON discounts
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'admin,producer'
                OR profiles.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
            )
        )
    );

-- Test the policies
SELECT 'Testing RLS policies for discounts table:' as info;

-- Check if current user can read discounts
SELECT 'Current user can read discounts:' as test;
SELECT COUNT(*) as discount_count FROM discounts;

-- Show all policies on discounts table
SELECT 'Current policies on discounts table:' as info;
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
WHERE tablename = 'discounts'; 