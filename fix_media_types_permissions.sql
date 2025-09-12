-- Fix media types permissions to allow producers and admins to manage media types
-- This addresses the 403 error when trying to save new sub-media types

-- Drop the restrictive admin-only policy
DROP POLICY IF EXISTS "Allow admin access to media types" ON media_types;

-- Create a new policy that allows both producers and admins to manage media types
CREATE POLICY "Allow producers and admins to manage media types" ON media_types
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE account_type IN ('admin', 'producer')
        )
    );

-- Also ensure the read policy is in place for all authenticated users
DROP POLICY IF EXISTS "Allow read access to media types" ON media_types;
CREATE POLICY "Allow read access to media types" ON media_types
    FOR SELECT USING (auth.role() = 'authenticated');

-- Verify the policies are in place
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
WHERE tablename = 'media_types'
ORDER BY policyname;



















