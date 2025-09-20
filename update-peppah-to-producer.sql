-- Update existing peppah.tracks@gmail.com to producer
-- Run this script in the Supabase SQL Editor

-- First, let's see what exists
SELECT 'BEFORE - Profile exists' as status, id::text as id, email, account_type FROM public.profiles WHERE email = 'peppah.tracks@gmail.com'
UNION ALL
SELECT 'BEFORE - Auth user exists' as status, id::text, email, 'auth' as account_type FROM auth.users WHERE email = 'peppah.tracks@gmail.com';

-- Update the existing profile to producer
UPDATE public.profiles 
SET account_type = 'producer',
    updated_at = now()
WHERE email = 'peppah.tracks@gmail.com';

-- Update the auth user metadata to producer
UPDATE auth.users 
SET raw_user_meta_data = '{"account_type":"producer"}',
    updated_at = now()
WHERE email = 'peppah.tracks@gmail.com';

-- Set a new password for the auth user
UPDATE auth.users 
SET encrypted_password = crypt('Peppah2024!', gen_salt('bf')),
    updated_at = now()
WHERE email = 'peppah.tracks@gmail.com';

-- Confirm the email if not already confirmed
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'peppah.tracks@gmail.com';

-- Final check
SELECT 'AFTER - Profile exists' as status, id::text as id, email, account_type FROM public.profiles WHERE email = 'peppah.tracks@gmail.com'
UNION ALL
SELECT 'AFTER - Auth user exists' as status, id::text, email, 'auth' as account_type FROM auth.users WHERE email = 'peppah.tracks@gmail.com';
