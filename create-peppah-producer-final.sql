-- Create producer account for peppah.tracks@gmail.com
-- Run this script in the Supabase SQL Editor

DO $$
DECLARE
  auth_user_id uuid;
BEGIN
  -- Create auth user
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
  
  -- Create producer profile
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
  
  RAISE NOTICE 'Producer account created successfully!';
  RAISE NOTICE 'Email: peppah.tracks@gmail.com';
  RAISE NOTICE 'Password: Peppah2024!';
  RAISE NOTICE 'Account Type: producer';
  RAISE NOTICE 'User ID: %', auth_user_id;
END $$;

-- Verify the account was created
SELECT 'VERIFICATION - PROFILES:' as info;
SELECT id, email, account_type, created_at FROM public.profiles WHERE email = 'peppah.tracks@gmail.com';

SELECT 'VERIFICATION - AUTH USERS:' as info;
SELECT id, email, email_confirmed_at, created_at FROM auth.users WHERE email = 'peppah.tracks@gmail.com';
