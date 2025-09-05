-- GET EXACT POLICIES: Find the specific policies causing the security issue
-- This will show us exactly what policies exist and which ones are dangerous

-- ============================================
-- 1. LIST ALL CURRENT POLICIES ON PROFILES TABLE
-- ============================================

SELECT 
    'ALL POLICIES ON PROFILES TABLE' as info,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================
-- 2. FIND SPECIFIC DANGEROUS POLICIES
-- ============================================

SELECT 
    'DANGEROUS POLICIES - USING TRUE' as warning,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
    AND qual LIKE '%true%';

-- ============================================
-- 3. FIND POLICIES WITHOUT RESTRICTIONS
-- ============================================

SELECT 
    'POLICIES WITHOUT RESTRICTIONS' as warning,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
    AND (qual IS NULL OR qual = '' OR qual = 'true')
    AND (with_check IS NULL OR with_check = '' OR with_check = 'true');

-- ============================================
-- 4. FIND POLICIES THAT ALLOW ALL ACCESS
-- ============================================

SELECT 
    'POLICIES ALLOWING ALL ACCESS' as warning,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
    AND (
        qual LIKE '%true%' 
        OR qual IS NULL 
        OR qual = ''
        OR qual LIKE '%1=1%'
        OR qual LIKE '%auth.uid() IS NOT NULL%'
    );

-- ============================================
-- 5. COUNT TOTAL POLICIES BY TYPE
-- ============================================

SELECT 
    'POLICY COUNT BY TYPE' as info,
    cmd,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'profiles'
GROUP BY cmd
ORDER BY cmd;
