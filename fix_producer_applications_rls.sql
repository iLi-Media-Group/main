-- Fix RLS Policies for producer_applications
-- This will allow admin users to see all applications

-- First, check current RLS status
SELECT 'Current RLS Status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'producer_applications';

-- Check existing policies
SELECT 'Existing Policies:' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'producer_applications';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for admin users" ON producer_applications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON producer_applications;
DROP POLICY IF EXISTS "Enable update for users based on email" ON producer_applications;
DROP POLICY IF EXISTS "Enable delete for admin users" ON producer_applications;

-- Create new policies that allow admin access
-- Policy 1: Allow admins to read all applications
CREATE POLICY "Enable read access for admin users" ON producer_applications
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type LIKE '%admin%'
        )
    );

-- Policy 2: Allow authenticated users to insert their own applications
CREATE POLICY "Enable insert for authenticated users" ON producer_applications
    FOR INSERT
    TO authenticated
    WITH CHECK (
        email = (SELECT email FROM profiles WHERE id = auth.uid())
    );

-- Policy 3: Allow users to update their own applications
CREATE POLICY "Enable update for users based on email" ON producer_applications
    FOR UPDATE
    TO authenticated
    USING (
        email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
    WITH CHECK (
        email = (SELECT email FROM profiles WHERE id = auth.uid())
    );

-- Policy 4: Allow admins to delete applications
CREATE POLICY "Enable delete for admin users" ON producer_applications
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type LIKE '%admin%'
        )
    );

-- Verify the new policies
SELECT 'New Policies:' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'producer_applications'
ORDER BY policyname;

-- Test the access
SELECT 'Testing Admin Access - All Records:' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM producer_applications 
ORDER BY created_at DESC;

-- Count total records
SELECT 'Total Records:' as info;
SELECT COUNT(*) as total_count FROM producer_applications; 