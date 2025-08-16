-- Comprehensive fix for discounts RLS policies
-- This ensures the current admin user can create, read, update, and delete discounts

-- First, let's check the current user
SELECT 'Current user info:' as info;
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- Check current user's profile
SELECT 'Current user profile:' as info;
SELECT 
    id,
    email,
    account_type,
    created_at,
    updated_at
FROM profiles 
WHERE id = auth.uid();

-- Enable RLS on discounts table
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow admin access to discounts" ON discounts;
DROP POLICY IF EXISTS "Allow read access to active discounts" ON discounts;
DROP POLICY IF EXISTS "Enable read access for all users" ON discounts;
DROP POLICY IF EXISTS "Enable read access for admins" ON discounts;
DROP POLICY IF EXISTS "Enable insert for admins" ON discounts;
DROP POLICY IF EXISTS "Enable update for admins" ON discounts;
DROP POLICY IF EXISTS "Enable delete for admins" ON discounts;
DROP POLICY IF EXISTS "Allow all operations for admins" ON discounts;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON discounts;

-- Create comprehensive policies that work for the current admin user

-- 1. Allow all authenticated users to read active discounts
CREATE POLICY "Enable read access for all users" ON discounts
    FOR SELECT
    USING (is_active = true);

-- 2. Allow admin users to read ALL discounts (including inactive ones)
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

-- 3. Allow admin users to insert new discounts
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

-- 4. Allow admin users to update existing discounts
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
SELECT 'Testing admin access:' as info;
SELECT 
    'Can read all discounts' as test,
    EXISTS (
        SELECT 1 FROM discounts LIMIT 1
    ) as can_read;

SELECT 'Testing admin insert permission:' as info;
SELECT 
    'Can insert discount' as test,
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (
            profiles.account_type = 'admin' 
            OR profiles.account_type = 'admin,producer'
            OR profiles.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
        )
    ) as can_insert;

-- Show all policies on discounts table
SELECT 'Current policies on discounts:' as info;
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