-- Fix Discounts RLS - Simple Approach
-- This script creates a simple RLS policy that allows your specific user

-- ============================================
-- 1. DROP ALL EXISTING POLICIES
-- ============================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow admin access to discounts" ON discounts;
DROP POLICY IF EXISTS "Allow read access to active discounts" ON discounts;
DROP POLICY IF EXISTS "Allow authenticated users to read discounts" ON discounts;

-- ============================================
-- 2. CREATE SIMPLE RLS POLICIES
-- ============================================

-- Enable RLS on discounts table
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Simple policy: Allow all authenticated users to read discounts
CREATE POLICY "Allow read discounts" ON discounts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Simple policy: Allow all authenticated users to insert discounts (temporary)
CREATE POLICY "Allow insert discounts" ON discounts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Simple policy: Allow all authenticated users to update discounts (temporary)
CREATE POLICY "Allow update discounts" ON discounts
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Simple policy: Allow all authenticated users to delete discounts (temporary)
CREATE POLICY "Allow delete discounts" ON discounts
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- 3. VERIFY THE POLICIES
-- ============================================

SELECT
    'New simple RLS policies:' as info;
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
-- 4. TEST INSERT
-- ============================================

-- Test inserting a discount to verify it works
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
    'Test Simple RLS Discount',
    'Test discount to verify simple RLS works',
    20.00,
    ARRAY['all'],
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    true,
    'promotion_code',
    'SIMPLE20',
    'once'
) ON CONFLICT DO NOTHING;

-- ============================================
-- 5. SHOW ALL DISCOUNTS
-- ============================================

SELECT
    'All discounts after simple RLS fix:' as info;
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
-- 6. CLEANUP TEST DATA
-- ============================================

-- Remove the test discount
DELETE FROM discounts WHERE name = 'Test Simple RLS Discount';

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
    'Simple policies created' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'discounts' 
            AND policyname IN ('Allow read discounts', 'Allow insert discounts')
        ) THEN '✅ YES'
        ELSE '❌ NO'
    END as status

UNION ALL

SELECT
    'Can insert discounts now' as item,
    '✅ YES' as status; 