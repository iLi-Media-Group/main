-- Check the current status of peppah.tracks@gmail.com
-- Run this script in the Supabase SQL Editor

-- Check profiles table
SELECT 'PROFILES TABLE:' as table_name;
SELECT id, email, account_type, created_at FROM public.profiles WHERE email = 'peppah.tracks@gmail.com';

-- Check auth.users table
SELECT 'AUTH.USERS TABLE:' as table_name;
SELECT id, email, email_confirmed_at, created_at FROM auth.users WHERE email = 'peppah.tracks@gmail.com';

-- Count total records
SELECT 'COUNTS:' as info;
SELECT 
  (SELECT COUNT(*) FROM public.profiles WHERE email = 'peppah.tracks@gmail.com') as profile_count,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'peppah.tracks@gmail.com') as auth_user_count;
