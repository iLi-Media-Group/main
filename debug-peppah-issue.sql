-- Debug the peppah issue and try a completely different approach
-- Run this script in the Supabase SQL Editor

-- Check what's in the profiles table
SELECT 'ALL PROFILES WITH peppah:' as info;
SELECT id, email, account_type, created_at FROM public.profiles WHERE email ILIKE '%peppah%';

-- Check what's in auth.users table
SELECT 'ALL AUTH USERS WITH peppah:' as info;
SELECT id, email, email_confirmed_at, created_at FROM auth.users WHERE email ILIKE '%peppah%';

-- Check for any email containing 'tracks'
SELECT 'ALL PROFILES WITH tracks:' as info;
SELECT id, email, account_type, created_at FROM public.profiles WHERE email ILIKE '%tracks%';

-- Check for any email containing 'tracks' in auth
SELECT 'ALL AUTH USERS WITH tracks:' as info;
SELECT id, email, email_confirmed_at, created_at FROM auth.users WHERE email ILIKE '%tracks%';

-- Try creating with a completely different email
DO $$
DECLARE
  auth_user_id uuid;
BEGIN
  -- Create auth user with completely different email
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
    'peppah.producer.2024@gmail.com', -- Completely different email
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
    'peppah.producer.2024@gmail.com', -- Completely different email
    'producer',
    now(),
    now()
  );
  
  RAISE NOTICE 'Producer account created with email peppah.producer.2024@gmail.com, ID: %', auth_user_id;
END $$;

-- Final check
SELECT 'FINAL - ALL peppah related profiles:' as info;
SELECT id, email, account_type FROM public.profiles WHERE email ILIKE '%peppah%'
UNION ALL
SELECT id::text, email, 'auth' as account_type FROM auth.users WHERE email ILIKE '%peppah%';
