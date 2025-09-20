-- Fix Discounts RLS Policies
-- This script fixes the Row Level Security policies for the discounts table

-- ============================================
-- 1. CHECK CURRENT RLS POLICIES
-- ============================================

SELECT
    'Current RLS policies for discounts table:' as info;
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

-- ============================================
-- 2. DROP EXISTING POLICIES
-- ============================================

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow admin access to discounts" ON discounts;
DROP POLICY IF EXISTS "Allow read access to active discounts" ON discounts;

-- ============================================
-- 3. CREATE PROPER RLS POLICIES
-- ============================================

-- Enable RLS on discounts table
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage discounts (INSERT, UPDATE, DELETE)
CREATE POLICY "Allow admin access to discounts" ON discounts
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE account_type IN ('admin', 'admin,producer')
        )
    );

-- Policy for all authenticated users to read active discounts
CREATE POLICY "Allow read access to active discounts" ON discounts
    FOR SELECT USING (
        is_active = true 
        AND CURRENT_DATE BETWEEN start_date AND end_date
    );

-- Policy for authenticated users to read all discounts (for admin dashboard)
CREATE POLICY "Allow authenticated users to read discounts" ON discounts
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- ============================================
-- 4. VERIFY THE POLICIES
-- ============================================

SELECT
    'Updated RLS policies for discounts table:' as info;
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

-- ============================================
-- 5. CHECK USER PERMISSIONS
-- ============================================

SELECT
    'Current user permissions check:' as info;
SELECT
    'Current user ID' as info,
    auth.uid() as user_id;

-- Check if current user is admin
SELECT
    'Admin check for current user:' as info;
SELECT
    id,
    email,
    account_type,
    CASE
        WHEN account_type IN ('admin', 'admin,producer') THEN '✅ IS ADMIN'
        ELSE '❌ NOT ADMIN'
    END as admin_status
FROM profiles
WHERE id = auth.uid();

-- ============================================
-- 6. TEST INSERT PERMISSION
-- ============================================

-- Test if we can insert a discount (this will show if the policy works)
SELECT
    'Testing insert permission:' as info;
SELECT
    CASE
        WHEN auth.uid() IN (
            SELECT id FROM profiles 
            WHERE account_type IN ('admin', 'admin,producer')
        ) THEN '✅ CAN INSERT DISCOUNTS'
        ELSE '❌ CANNOT INSERT DISCOUNTS'
    END as insert_permission;

-- ============================================
-- 7. SUMMARY
-- ============================================

SELECT
    'Summary:' as info;
SELECT
    'RLS enabled on discounts' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'discounts' 
            AND rowsecurity = true
        ) THEN '✅ YES'
        ELSE '❌ NO'
    END as status

UNION ALL

SELECT
    'Admin policies created' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'discounts' 
            AND policyname = 'Allow admin access to discounts'
        ) THEN '✅ YES'
        ELSE '❌ NO'
    END as status

UNION ALL

SELECT
    'Read policies created' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'discounts' 
            AND policyname IN ('Allow read access to active discounts', 'Allow authenticated users to read discounts')
        ) THEN '✅ YES'
        ELSE '❌ NO'
    END as status; 