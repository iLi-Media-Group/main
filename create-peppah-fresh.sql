-- Create fresh producer account for peppah.tracks@gmail.com
-- Run this script in the Supabase SQL Editor

-- First, let's confirm nothing exists
SELECT 'BEFORE - Profile exists' as status, id::text as id, email, account_type FROM public.profiles WHERE email = 'peppah.tracks@gmail.com'
UNION ALL
SELECT 'BEFORE - Auth user exists' as status, id::text, email, 'auth' as account_type FROM auth.users WHERE email = 'peppah.tracks@gmail.com';

-- Create the producer account from scratch
DO $$
DECLARE
  auth_user_id uuid;
BEGIN
  -- Create new auth user
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
    'peppah.tracks@gmail.com',
    crypt('Peppah2024!', gen_salt('bf')),
    now(),
    now(),
    now(),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    '{"provider":"email","providers":["email"]}',
    '{"account_type":"producer"}'
  ) RETURNING id INTO auth_user_id;
  
  -- Create new producer profile
  INSERT INTO public.profiles (
    id,
    email,
    account_type,
    created_at,
    updated_at
  ) VALUES (
    auth_user_id,
    'peppah.tracks@gmail.com',
    'producer',
    now(),
    now()
  );
  
  RAISE NOTICE 'Producer account created successfully with ID: %', auth_user_id;
END $$;

-- Final check
SELECT 'AFTER - Profile exists' as status, id::text as id, email, account_type FROM public.profiles WHERE email = 'peppah.tracks@gmail.com'
UNION ALL
SELECT 'AFTER - Auth user exists' as status, id::text, email, 'auth' as account_type FROM auth.users WHERE email = 'peppah.tracks@gmail.com';
