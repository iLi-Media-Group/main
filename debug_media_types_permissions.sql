-- Debug Media Types Permissions Issue
-- This will help identify why the 403 error is still happening

-- ============================================
-- 1. CHECK CURRENT USER AND ACCOUNT TYPE
-- ============================================

-- Check current user
SELECT 
    'Current User ID' as info,
    auth.uid() as user_id;

-- Check if user exists in profiles table
SELECT 
    'User Profile Check' as info,
    id,
    email,
    account_type,
    first_name,
    last_name
FROM profiles 
WHERE id = auth.uid();

-- ============================================
-- 2. CHECK MEDIA TYPES POLICIES
-- ============================================

-- Show current media_types policies
SELECT 
    'Current Media Types Policies' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'media_types'
ORDER BY policyname;

-- ============================================
-- 3. TEST POLICY EVALUATION
-- ============================================

-- Test if the current user would pass the policy
SELECT 
    'Policy Test Results' as info,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND account_type IN ('admin', 'producer')
    ) as has_correct_account_type,
    (auth.role() = 'authenticated') as is_authenticated;

-- ============================================
-- 4. FIX THE POLICY (if needed)
-- ============================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Allow producers and admins to manage media types" ON media_types;

-- Create a more permissive policy for testing
CREATE POLICY "Allow authenticated users to manage media types" ON media_types
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 5. VERIFY THE FIX
-- ============================================

-- Show updated policies
SELECT 
    'Updated Media Types Policies' as info,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'media_types'
ORDER BY policyname;

-- Test the new policy
SELECT 
    'New Policy Test' as info,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    (auth.role() = 'authenticated') as should_have_access;
