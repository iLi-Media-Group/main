-- Fix Media Types Admin Access
-- Remove all existing policies and create a clean one for admin access

-- ============================================
-- 1. REMOVE ALL EXISTING MEDIA TYPES POLICIES
-- ============================================

-- Drop all existing policies on media_types
DROP POLICY IF EXISTS "Allow producers and admins to manage media types" ON media_types;
DROP POLICY IF EXISTS "Allow read access to media types" ON media_types;
DROP POLICY IF EXISTS "Allow authenticated users to manage media types" ON media_types;
DROP POLICY IF EXISTS "Allow admin access to media types" ON media_types;

-- Drop any other policies that might exist
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'media_types'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON media_types', policy_record.policyname);
    END LOOP;
END $$;

-- ============================================
-- 2. CREATE CLEAN POLICIES
-- ============================================

-- Allow all authenticated users to read media types
CREATE POLICY "Allow read access to media types" ON media_types
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins and producers to manage media types
CREATE POLICY "Allow admins and producers to manage media types" ON media_types
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE account_type IN ('admin', 'producer')
        )
    );

-- ============================================
-- 3. VERIFY THE FIX
-- ============================================

-- Show the new policies
SELECT 
    'New Media Types Policies' as info,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'media_types'
ORDER BY policyname;

-- Test if current user has access
SELECT 
    'Access Test' as info,
    auth.uid() as user_id,
    auth.role() as role,
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND account_type IN ('admin', 'producer')
    ) as has_admin_producer_access;

