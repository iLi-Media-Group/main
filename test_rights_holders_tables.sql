-- Test script to check if rights_holders tables exist
-- Run this in Supabase SQL editor to diagnose the 406 errors

-- Check if rights_holders table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rights_holders'
) as rights_holders_exists;

-- Check if rights_holder_profiles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rights_holder_profiles'
) as rights_holder_profiles_exists;

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rights_holders' 
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('rights_holders', 'rights_holder_profiles');

-- Test basic query (this should work if tables exist and RLS is configured)
SELECT COUNT(*) as total_rights_holders FROM rights_holders;
