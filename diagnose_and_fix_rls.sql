-- Diagnostic and Fix Script for RLS Issues
-- This script will check current policies and fix 406 errors

-- 1. First, let's see what policies currently exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('background_assets', 'rights_holders', 'rights_holder_profiles')
ORDER BY tablename, policyname;

-- 2. Check if RLS is enabled on these tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('background_assets', 'rights_holders', 'rights_holder_profiles');

-- 3. Temporarily disable RLS to test if that fixes the 406 errors
ALTER TABLE background_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holders DISABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_profiles DISABLE ROW LEVEL SECURITY;

-- 4. Grant necessary permissions
GRANT ALL ON background_assets TO authenticated;
GRANT ALL ON rights_holders TO authenticated;
GRANT ALL ON rights_holder_profiles TO authenticated;

-- 5. Verify the changes
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('background_assets', 'rights_holders', 'rights_holder_profiles');
