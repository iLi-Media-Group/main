-- Fix Email Constraint Issue
-- This script addresses the unique email constraint that's preventing auth user creation

-- 1. First, let's see what exists for peppah.tracks@gmail.com
SELECT 'CURRENT STATE FOR peppah.tracks@gmail.com:' as info;

-- Check auth users
SELECT 'AUTH USERS:' as table_name, id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com';

-- Check profiles
SELECT 'PROFILES:' as table_name, id, email, account_type, created_at, updated_at 
FROM profiles 
WHERE email = 'peppah.tracks@gmail.com';

-- 2. Check the email constraint on profiles table
SELECT 'EMAIL CONSTRAINT ON PROFILES:' as info;
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  tc.is_deferrable,
  tc.initially_deferred
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'profiles'
  AND tc.table_schema = 'public'
  AND kcu.column_name = 'email';

-- 3. Check if there are any orphaned profiles (profiles without auth users)
SELECT 'ORPHANED PROFILES (no auth user):' as info;
SELECT 
  p.id,
  p.email,
  p.account_type,
  p.created_at,
  CASE WHEN au.id IS NULL THEN 'NO AUTH USER' ELSE 'HAS AUTH USER' END as auth_status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL
ORDER BY p.created_at DESC;

-- 4. Check if there are any orphaned auth users (auth users without profiles)
SELECT 'ORPHANED AUTH USERS (no profile):' as info;
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  CASE WHEN p.id IS NULL THEN 'NO PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- 5. Clean up the peppah.tracks@gmail.com situation
-- Option A: If there's a profile but no auth user, create auth user with that profile ID
DO $$
DECLARE
  profile_id uuid;
  auth_user_id uuid;
BEGIN
  -- Check if profile exists but no auth user
  SELECT p.id INTO profile_id 
  FROM profiles p 
  LEFT JOIN auth.users au ON p.id = au.id 
  WHERE p.email = 'peppah.tracks@gmail.com' AND au.id IS NULL;
  
  IF profile_id IS NOT NULL THEN
    RAISE NOTICE 'Found orphaned profile for peppah.tracks@gmail.com with ID: %', profile_id;
    
    -- Create auth user using the existing profile ID
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
      profile_id, -- Use the existing profile ID
      'authenticated',
      'authenticated',
      'peppah.tracks@gmail.com',
      crypt('Mbfpr123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      encode(gen_random_bytes(32), 'hex'),
      encode(gen_random_bytes(32), 'hex'),
      '{"provider":"email","providers":["email"]}',
      '{"account_type":"producer"}'
    ) RETURNING id INTO auth_user_id;
    
    RAISE NOTICE '✅ Auth user created successfully with ID: %', auth_user_id;
  ELSE
    RAISE NOTICE 'No orphaned profile found for peppah.tracks@gmail.com';
  END IF;
END $$;

-- Option B: If there's an auth user but no profile, create profile
DO $$
DECLARE
  auth_user_id uuid;
  profile_id uuid;
BEGIN
  -- Check if auth user exists but no profile
  SELECT au.id INTO auth_user_id 
  FROM auth.users au 
  LEFT JOIN profiles p ON au.id = p.id 
  WHERE au.email = 'peppah.tracks@gmail.com' AND p.id IS NULL;
  
  IF auth_user_id IS NOT NULL THEN
    RAISE NOTICE 'Found orphaned auth user for peppah.tracks@gmail.com with ID: %', auth_user_id;
    
    -- Create profile using the existing auth user ID
    INSERT INTO profiles (
      id,
      email,
      account_type,
      created_at,
      updated_at
    ) VALUES (
      auth_user_id, -- Use the existing auth user ID
      'peppah.tracks@gmail.com',
      'producer',
      now(),
      now()
    ) RETURNING id INTO profile_id;
    
    RAISE NOTICE '✅ Profile created successfully with ID: %', profile_id;
  ELSE
    RAISE NOTICE 'No orphaned auth user found for peppah.tracks@gmail.com';
  END IF;
END $$;

-- 6. If both exist but with different IDs, we need to fix the mismatch
DO $$
DECLARE
  auth_user_id uuid;
  profile_id uuid;
BEGIN
  -- Get the auth user ID
  SELECT id INTO auth_user_id FROM auth.users WHERE email = 'peppah.tracks@gmail.com';
  
  -- Get the profile ID
  SELECT id INTO profile_id FROM profiles WHERE email = 'peppah.tracks@gmail.com';
  
  -- If both exist but with different IDs, update the profile to match the auth user
  IF auth_user_id IS NOT NULL AND profile_id IS NOT NULL AND auth_user_id != profile_id THEN
    RAISE NOTICE 'Found mismatch: Auth user ID: %, Profile ID: %', auth_user_id, profile_id;
    
    -- Update the profile to use the auth user ID
    UPDATE profiles 
    SET id = auth_user_id, 
        updated_at = now()
    WHERE email = 'peppah.tracks@gmail.com';
    
    RAISE NOTICE '✅ Profile updated to match auth user ID';
  END IF;
END $$;

-- 7. Final verification
SELECT 'FINAL STATE FOR peppah.tracks@gmail.com:' as info;

-- Check auth users
SELECT 'AUTH USERS:' as table_name, id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com';

-- Check profiles
SELECT 'PROFILES:' as table_name, id, email, account_type, created_at, updated_at 
FROM profiles 
WHERE email = 'peppah.tracks@gmail.com';

-- 8. Test if the user can now sign in
-- This will help verify that the auth user is properly set up
SELECT 'AUTH USER VERIFICATION:' as info;
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  CASE WHEN p.id IS NOT NULL THEN 'LINKED' ELSE 'UNLINKED' END as profile_status,
  p.account_type
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'peppah.tracks@gmail.com';

-- 9. If everything is still broken, create a completely fresh user
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if we still have issues
  IF NOT EXISTS (
    SELECT 1 FROM auth.users au 
    LEFT JOIN profiles p ON au.id = p.id 
    WHERE au.email = 'peppah.tracks@gmail.com' AND p.id IS NOT NULL
  ) THEN
    RAISE NOTICE 'Creating completely fresh user for peppah.tracks@gmail.com';
    
    -- Delete any existing records
    DELETE FROM profiles WHERE email = 'peppah.tracks@gmail.com';
    DELETE FROM auth.users WHERE email = 'peppah.tracks@gmail.com';
    
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
      crypt('Mbfpr123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      encode(gen_random_bytes(32), 'hex'),
      encode(gen_random_bytes(32), 'hex'),
      '{"provider":"email","providers":["email"]}',
      '{"account_type":"producer"}'
    ) RETURNING id INTO new_user_id;
    
    -- Create new profile
    INSERT INTO profiles (
      id,
      email,
      account_type,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      'peppah.tracks@gmail.com',
      'producer',
      now(),
      now()
    );
    
    RAISE NOTICE '✅ Fresh user created with ID: %', new_user_id;
  ELSE
    RAISE NOTICE 'User is already properly linked, no action needed';
  END IF;
END $$;
