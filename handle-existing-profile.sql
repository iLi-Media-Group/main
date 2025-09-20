-- Handle Existing Profile Issue
-- This script handles the case where a profile already exists with the generated UUID

-- 1. First, let's see what exists
SELECT 'CURRENT STATE:' as info;

SELECT 'AUTH USERS:' as table_name, id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com';

SELECT 'PROFILES:' as table_name, id, email, account_type, created_at, updated_at 
FROM profiles 
WHERE email = 'peppah.tracks@gmail.com';

-- 2. Create auth user first, then handle profile
SELECT 'CREATING AUTH USER:' as info;

DO $$
DECLARE
  fresh_user_id uuid;
  profile_exists boolean;
BEGIN
  -- Generate a completely new UUID
  fresh_user_id := gen_random_uuid();
  
  RAISE NOTICE 'Generated new UUID: %', fresh_user_id;
  
  -- Check if a profile already exists with this UUID
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = fresh_user_id) INTO profile_exists;
  
  IF profile_exists THEN
    RAISE NOTICE 'Profile already exists with UUID: %. Will update it.', fresh_user_id;
  ELSE
    RAISE NOTICE 'No existing profile with UUID: %. Will create new one.', fresh_user_id;
  END IF;
  
  -- Create the auth user
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
    fresh_user_id,
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
  );
  
  RAISE NOTICE '✅ Auth user created with ID: %', fresh_user_id;
  
  -- Handle the profile - update if exists, insert if not
  IF profile_exists THEN
    -- Update existing profile
    UPDATE profiles 
    SET email = 'peppah.tracks@gmail.com',
        account_type = 'producer',
        updated_at = now()
    WHERE id = fresh_user_id;
    
    RAISE NOTICE '✅ Existing profile updated for ID: %', fresh_user_id;
  ELSE
    -- Create new profile
    INSERT INTO profiles (
      id,
      email,
      account_type,
      created_at,
      updated_at
    ) VALUES (
      fresh_user_id,
      'peppah.tracks@gmail.com',
      'producer',
      now(),
      now()
    );
    
    RAISE NOTICE '✅ New profile created with ID: %', fresh_user_id;
  END IF;
  
  -- Store the ID for verification
  PERFORM set_config('peppah.fresh_user_id', fresh_user_id::text, false);
END $$;

-- 3. Get the user ID
SELECT 'USER ID:' as info, current_setting('peppah.fresh_user_id') as fresh_user_id;

-- 4. Final verification
SELECT 'FINAL VERIFICATION:' as info;

SELECT 'AUTH USERS:' as table_name, id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com';

SELECT 'PROFILES:' as table_name, id, email, account_type, created_at, updated_at 
FROM profiles 
WHERE email = 'peppah.tracks@gmail.com';

-- 5. Test the linkage
SELECT 'LINKAGE TEST:' as info;
SELECT 
  au.id,
  au.email as auth_email,
  au.email_confirmed_at,
  p.email as profile_email,
  p.account_type,
  CASE WHEN p.id IS NOT NULL THEN 'LINKED' ELSE 'UNLINKED' END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'peppah.tracks@gmail.com';

-- 6. Ready for testing
SELECT 'READY FOR TESTING:' as info;
SELECT 
  'peppah.tracks@gmail.com' as email,
  'Mbfpr123!' as password,
  'producer' as account_type,
  au.id as user_id
FROM auth.users au
WHERE au.email = 'peppah.tracks@gmail.com';
