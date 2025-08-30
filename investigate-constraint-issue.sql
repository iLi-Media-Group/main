-- Investigate the constraint issue and try a completely different approach
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

-- Check the profiles table structure and constraints
SELECT 'PROFILES TABLE INFO:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for unique constraints on profiles table
SELECT 'UNIQUE CONSTRAINTS ON PROFILES:' as info;
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

-- Try creating with a completely different email domain
DO $$
DECLARE
  auth_user_id uuid;
BEGIN
  -- Create auth user with completely different email domain
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
    'peppah.producer@outlook.com', -- Completely different email domain
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
    'peppah.producer@outlook.com', -- Completely different email domain
    'producer',
    now(),
    now()
  );
  
  RAISE NOTICE 'Producer account created with email peppah.producer@outlook.com, ID: %', auth_user_id;
END $$;

-- Final check
SELECT 'FINAL - ALL peppah related profiles:' as info;
SELECT id, email, account_type FROM public.profiles WHERE email ILIKE '%peppah%'
UNION ALL
SELECT id::text, email, 'auth' as account_type FROM auth.users WHERE email ILIKE '%peppah%';
