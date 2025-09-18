-- Fix Media Types Policy for Comma-Separated Account Types
-- Your account_type is 'admin,producer' but the policy only checks for exact matches

-- ============================================
-- 1. CHECK CURRENT ACCOUNT TYPE
-- ============================================

-- Show current account type
SELECT 
    'Current Account Type' as info,
    id,
    email,
    account_type
FROM profiles 
WHERE id = auth.uid();

-- ============================================
-- 2. FIX THE POLICY TO HANDLE COMMA-SEPARATED VALUES
-- ============================================

-- Drop the current restrictive policy
DROP POLICY IF EXISTS "Allow producers and admins to manage media types" ON media_types;

-- Create a new policy that handles comma-separated account types
CREATE POLICY "Allow producers and admins to manage media types" ON media_types
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE account_type IN ('admin', 'producer')
            OR account_type LIKE '%admin%'
            OR account_type LIKE '%producer%'
        )
    );

-- ============================================
-- 3. VERIFY THE FIX
-- ============================================

-- Test if the new policy works for your account type
SELECT 
    'Policy Test' as info,
    auth.uid() as user_id,
    (SELECT account_type FROM profiles WHERE id = auth.uid()) as account_type,
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND (
            account_type IN ('admin', 'producer')
            OR account_type LIKE '%admin%'
            OR account_type LIKE '%producer%'
        )
    ) as should_have_access;

-- Show updated policies
SELECT 
    'Updated Policies' as info,
    policyname,
    cmd,
    qual as condition
FROM pg_policies 
WHERE tablename = 'media_types'
ORDER BY policyname;
