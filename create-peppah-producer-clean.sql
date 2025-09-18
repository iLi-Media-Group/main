-- Create producer authentication for peppah.tracks@gmail.com (with cleanup)
-- Run this script in the Supabase SQL Editor

-- First, let's see what exists
SELECT 'Profile exists' as status, id::text as id, email, account_type FROM public.profiles WHERE email = 'peppah.tracks@gmail.com'
UNION ALL
SELECT 'Auth user exists' as status, id::text, email, 'auth' as account_type FROM auth.users WHERE email = 'peppah.tracks@gmail.com';

-- Clean up and create new producer account
DO $$
DECLARE
  auth_user_id uuid;
  existing_profile_id uuid;
BEGIN
  -- Get existing profile ID
  SELECT id INTO existing_profile_id FROM public.profiles WHERE email = 'peppah.tracks@gmail.com';
  
  -- Delete existing profile if it exists
  IF existing_profile_id IS NOT NULL THEN
    DELETE FROM public.profiles WHERE email = 'peppah.tracks@gmail.com';
    RAISE NOTICE 'Deleted existing profile with ID: %', existing_profile_id;
  END IF;
  
  -- Delete existing auth user if it exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'peppah.tracks@gmail.com') THEN
    DELETE FROM auth.users WHERE email = 'peppah.tracks@gmail.com';
    RAISE NOTICE 'Deleted existing auth user';
  END IF;
  
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
    gen_random_uuid(), -- Generate new UUID
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
  
  RAISE NOTICE 'Producer auth user and profile created successfully with ID: %', auth_user_id;
END $$;
