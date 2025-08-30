-- Check Media Types Policies First
-- Let's see what policies exist before making any changes

-- ============================================
-- 1. CHECK CURRENT USER STATUS
-- ============================================

-- Check current user
SELECT 
    'Current User Info' as info,
    auth.uid() as user_id,
    auth.role() as role;

-- Check user profile
SELECT 
    'User Profile' as info,
    id,
    email,
    account_type,
    first_name,
    last_name
FROM profiles 
WHERE id = auth.uid();

-- ============================================
-- 2. CHECK ALL EXISTING MEDIA_TYPES POLICIES
-- ============================================

-- Show all current policies on media_types table
SELECT 
    'Current Media Types Policies' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'media_types'
ORDER BY policyname;

-- Count how many policies exist
SELECT 
    'Policy Count' as info,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'media_types';

-- ============================================
-- 3. CHECK TABLE STRUCTURE
-- ============================================

-- Check if RLS is enabled
SELECT 
    'RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'media_types';

-- ============================================
-- 4. TEST CURRENT POLICY EVALUATION
-- ============================================

-- Test if current user would pass each policy
SELECT 
    'Policy Evaluation Test' as info,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN 
            CASE WHEN qual LIKE '%auth.role() = ''authenticated''%' THEN 'Should work for SELECT'
                 WHEN qual LIKE '%auth.uid() IN%' THEN 'Depends on account_type'
                 ELSE 'Unknown SELECT policy'
            END
        WHEN cmd = 'ALL' THEN 
            CASE WHEN qual LIKE '%auth.uid() IN%' THEN 'Depends on account_type'
                 ELSE 'Unknown ALL policy'
            END
        ELSE 'Other command'
    END as policy_analysis
FROM pg_policies 
WHERE tablename = 'media_types';

-- ============================================
-- 5. CHECK IF USER HAS CORRECT ACCOUNT TYPE
-- ============================================

-- Test the account_type check that the policy uses
SELECT 
    'Account Type Check' as info,
    auth.uid() as current_user_id,
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND account_type IN ('admin', 'producer')
    ) as has_admin_producer_access,
    (SELECT account_type FROM profiles WHERE id = auth.uid()) as actual_account_type;

-- ============================================
-- 6. SHOW WHAT THE POLICIES ARE ACTUALLY DOING
-- ============================================

-- Show the actual policy conditions
SELECT 
    'Policy Details' as info,
    policyname,
    cmd,
    qual as condition,
    with_check as check_condition
FROM pg_policies 
WHERE tablename = 'media_types'
ORDER BY policyname;
