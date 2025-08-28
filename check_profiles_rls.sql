-- Check RLS policies on profiles table
-- Run this in Supabase SQL Editor

-- Check if RLS is enabled on profiles
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Check all RLS policies on profiles table
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
WHERE tablename = 'profiles';

-- Test if we can access the specific profile
SELECT 
    id,
    first_name,
    last_name,
    email,
    account_type
FROM profiles 
WHERE id = 'c688fcdf-c5fa-46cd-b5c5-eb16f0632458';

-- Test if we can access any profiles
SELECT 
    id,
    first_name,
    last_name,
    email,
    account_type
FROM profiles 
LIMIT 5;
