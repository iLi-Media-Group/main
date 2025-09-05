-- Fix Discounts RLS Policies for Hybrid Admin/Producer
-- This script fixes the RLS policies to properly handle admin,producer hybrid roles

-- ============================================
-- 1. CHECK CURRENT USER ROLE
-- ============================================

SELECT
    'Current user role check:' as info;
SELECT
    id,
    email,
    account_type,
    CASE
        WHEN account_type = 'admin' THEN '✅ ADMIN'
        WHEN account_type = 'admin,producer' THEN '✅ HYBRID ADMIN/PRODUCER'
        WHEN account_type = 'producer' THEN '✅ PRODUCER'
        WHEN account_type LIKE '%admin%' THEN '✅ HAS ADMIN ACCESS'
        ELSE '❌ NO ADMIN ACCESS'
    END as role_status
FROM profiles
WHERE id = auth.uid();

-- ============================================
-- 2. DROP EXISTING POLICIES
-- ============================================

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow admin access to discounts" ON discounts;
DROP POLICY IF EXISTS "Allow read access to active discounts" ON discounts;
DROP POLICY IF EXISTS "Allow authenticated users to read discounts" ON discounts;

-- ============================================
-- 3. CREATE PROPER RLS POLICIES FOR HYBRID ROLES
-- ============================================

-- Enable RLS on discounts table
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Policy for admins and hybrid admin/producer to manage discounts (INSERT, UPDATE, DELETE)
CREATE POLICY "Allow admin access to discounts" ON discounts
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE account_type LIKE '%admin%'  -- This will match 'admin', 'admin,producer', etc.
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
-- 5. TEST HYBRID ROLE PERMISSIONS
-- ============================================

-- Test if current user can insert discounts
SELECT
    'Testing insert permission for hybrid role:' as info;
SELECT
    CASE
        WHEN auth.uid() IN (
            SELECT id FROM profiles 
            WHERE account_type LIKE '%admin%'
        ) THEN '✅ CAN INSERT DISCOUNTS (HAS ADMIN ACCESS)'
        ELSE '❌ CANNOT INSERT DISCOUNTS (NO ADMIN ACCESS)'
    END as insert_permission;

-- Show all users with admin access
SELECT
    'All users with admin access:' as info;
SELECT
    id,
    email,
    account_type,
    CASE
        WHEN account_type LIKE '%admin%' THEN '✅ HAS ADMIN ACCESS'
        ELSE '❌ NO ADMIN ACCESS'
    END as admin_access
FROM profiles
WHERE account_type LIKE '%admin%'
ORDER BY account_type, email;

-- ============================================
-- 6. TEST INSERT WITH CURRENT USER
-- ============================================

-- Test inserting a discount to verify the policy works
INSERT INTO discounts (
    name,
    description,
    discount_percent,
    applies_to,
    start_date,
    end_date,
    is_active,
    discount_type,
    promotion_code,
    duration_type
) VALUES (
    'Test Hybrid Admin Discount',
    'Test discount to verify hybrid admin access',
    15.00,
    ARRAY['all'],
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    true,
    'promotion_code',
    'HYBRID15',
    'once'
) ON CONFLICT DO NOTHING;

-- ============================================
-- 7. SHOW ALL DISCOUNTS AFTER TEST
-- ============================================

SELECT
    'All discounts after hybrid admin test:' as info;
SELECT
    id,
    name,
    description,
    promotion_code,
    discount_percent,
    discount_type,
    applies_to,
    is_active,
    start_date,
    end_date,
    created_at
FROM discounts
ORDER BY created_at DESC;

-- ============================================
-- 8. CLEANUP TEST DATA
-- ============================================

-- Remove the test discount
DELETE FROM discounts WHERE name = 'Test Hybrid Admin Discount';

-- ============================================
-- 9. SUMMARY
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
    'Hybrid admin access working' as item,
    CASE 
        WHEN auth.uid() IN (
            SELECT id FROM profiles 
            WHERE account_type LIKE '%admin%'
        ) THEN '✅ YES'
        ELSE '❌ NO'
    END as status; 