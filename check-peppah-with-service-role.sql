-- Check for peppah.tracks@gmail.com using service role (bypasses RLS)
-- Run this script in the Supabase SQL Editor

-- Check profiles table with service role
SELECT 'PROFILES TABLE (Service Role):' as table_name;
SELECT id, email, account_type, created_at FROM public.profiles WHERE email = 'peppah.tracks@gmail.com';

-- Check auth.users table
SELECT 'AUTH.USERS TABLE:' as table_name;
SELECT id, email, email_confirmed_at, created_at FROM auth.users WHERE email = 'peppah.tracks@gmail.com';

-- Count total records
SELECT 'COUNTS:' as info;
SELECT 
  (SELECT COUNT(*) FROM public.profiles WHERE email = 'peppah.tracks@gmail.com') as profile_count,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'peppah.tracks@gmail.com') as auth_user_count;

-- Try to find any records with similar email
SELECT 'SIMILAR EMAILS:' as info;
SELECT id, email, account_type FROM public.profiles WHERE email ILIKE '%peppah%' OR email ILIKE '%tracks%';

-- Check if there are any soft-deleted records
SELECT 'ALL PROFILES WITH EMAIL:' as info;
SELECT id, email, account_type, created_at, updated_at FROM public.profiles WHERE email IS NOT NULL ORDER BY created_at DESC LIMIT 10;








