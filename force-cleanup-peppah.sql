-- Force cleanup peppah.tracks@gmail.com and try different approaches
-- Run this script in the Supabase SQL Editor

-- First, let's see what exists
SELECT 'BEFORE - Profile exists' as status, id::text as id, email, account_type FROM public.profiles WHERE email = 'peppah.tracks@gmail.com'
UNION ALL
SELECT 'BEFORE - Auth user exists' as status, id::text, email, 'auth' as account_type FROM auth.users WHERE email = 'peppah.tracks@gmail.com';

-- Try to force delete with different approaches
DELETE FROM public.profiles WHERE email = 'peppah.tracks@gmail.com';
DELETE FROM auth.users WHERE email = 'peppah.tracks@gmail.com';

-- Check if there are any records with similar email patterns
SELECT 'SIMILAR EMAILS FOUND:' as info;
SELECT id, email, account_type FROM public.profiles WHERE email ILIKE '%peppah%' OR email ILIKE '%tracks%';

-- Try creating with a slightly different email first
DO $$
DECLARE
  auth_user_id uuid;
BEGIN
  -- Create auth user with slightly different email
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'peppah.tracks+producer@gmail.com', -- Using +producer to make it unique
    crypt('Peppah2024!', gen_salt('bf')),
    now(),
    now(),
    now(),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    '{"provider":"email","providers":["email"]}',
    '{"account_type":"producer"}'
  ) RETURNING id INTO auth_user_id;
  
  -- Create producer profile
  INSERT INTO public.profiles (
    id,
    email,
    account_type,
    created_at,
    updated_at
  ) VALUES (
    auth_user_id,
    'peppah.tracks+producer@gmail.com', -- Using +producer to make it unique
    'producer',
    now(),
    now()
  );
  
  RAISE NOTICE 'Producer account created with email peppah.tracks+producer@gmail.com, ID: %', auth_user_id;
END $$;

-- Final check
SELECT 'AFTER - Profile exists' as status, id::text as id, email, account_type FROM public.profiles WHERE email ILIKE '%peppah%'
UNION ALL
SELECT 'AFTER - Auth user exists' as status, id::text, email, 'auth' as account_type FROM auth.users WHERE email ILIKE '%peppah%';
