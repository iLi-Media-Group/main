-- Fix Peppah Duplicate Key Issue
-- This script specifically handles the duplicate key constraint violation

-- 1. First, let's see exactly what exists
SELECT 'CURRENT STATE ANALYSIS:' as info;

-- Check what's in auth.users
SELECT 'AUTH USERS:' as table_name, id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com' OR id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- Check what's in profiles
SELECT 'PROFILES:' as table_name, id, email, account_type, created_at, updated_at 
FROM profiles 
WHERE email = 'peppah.tracks@gmail.com' OR id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- 2. Check if there are any orphaned records with that ID
SELECT 'ORPHANED RECORDS WITH ID 861b9ca9-e89d-4478-b668-d182c1744930:' as info;
SELECT 
  'profiles' as table_name,
  id,
  email,
  account_type,
  created_at
FROM profiles 
WHERE id = '861b9ca9-e89d-4478-b668-d182c1744930'
UNION ALL
SELECT 
  'auth.users' as table_name,
  id,
  email,
  'auth' as account_type,
  created_at
FROM auth.users 
WHERE id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- 3. Clean up the specific ID conflict
DO $$
DECLARE
  existing_profile_email text;
  existing_auth_email text;
BEGIN
  -- Check what email is in the profile with that ID
  SELECT email INTO existing_profile_email 
  FROM profiles 
  WHERE id = '861b9ca9-e89d-4478-b668-d182c1744930';
  
  -- Check what email is in the auth user with that ID
  SELECT email INTO existing_auth_email 
  FROM auth.users 
  WHERE id = '861b9ca9-e89d-4478-b668-d182c1744930';
  
  RAISE NOTICE 'Profile with ID 861b9ca9-e89d-4478-b668-d182c1744930 has email: %', existing_profile_email;
  RAISE NOTICE 'Auth user with ID 861b9ca9-e89d-4478-b668-d182c1744930 has email: %', existing_auth_email;
  
  -- If the profile has a different email, update it to peppah.tracks@gmail.com
  IF existing_profile_email IS NOT NULL AND existing_profile_email != 'peppah.tracks@gmail.com' THEN
    RAISE NOTICE 'Updating profile email from % to peppah.tracks@gmail.com', existing_profile_email;
    
    UPDATE profiles 
    SET email = 'peppah.tracks@gmail.com',
        account_type = 'producer',
        updated_at = now()
    WHERE id = '861b9ca9-e89d-4478-b668-d182c1744930';
    
    RAISE NOTICE '✅ Profile updated successfully';
  END IF;
  
  -- If the auth user has a different email, update it to peppah.tracks@gmail.com
  IF existing_auth_email IS NOT NULL AND existing_auth_email != 'peppah.tracks@gmail.com' THEN
    RAISE NOTICE 'Updating auth user email from % to peppah.tracks@gmail.com', existing_auth_email;
    
    UPDATE auth.users 
    SET email = 'peppah.tracks@gmail.com',
        raw_user_meta_data = '{"account_type":"producer"}',
        updated_at = now()
    WHERE id = '861b9ca9-e89d-4478-b668-d182c1744930';
    
    RAISE NOTICE '✅ Auth user updated successfully';
  END IF;
  
  -- If the auth user doesn't exist, create it
  IF existing_auth_email IS NULL THEN
    RAISE NOTICE 'Creating auth user with ID 861b9ca9-e89d-4478-b668-d182c1744930';
    
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
      '861b9ca9-e89d-4478-b668-d182c1744930',
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
    
    RAISE NOTICE '✅ Auth user created successfully';
  END IF;
  
  -- If the profile doesn't exist, create it
  IF existing_profile_email IS NULL THEN
    RAISE NOTICE 'Creating profile with ID 861b9ca9-e89d-4478-b668-d182c1744930';
    
    INSERT INTO profiles (
      id,
      email,
      account_type,
      created_at,
      updated_at
    ) VALUES (
      '861b9ca9-e89d-4478-b668-d182c1744930',
      'peppah.tracks@gmail.com',
      'producer',
      now(),
      now()
    );
    
    RAISE NOTICE '✅ Profile created successfully';
  END IF;
END $$;

-- 4. Verify the fix worked
SELECT 'VERIFICATION AFTER FIX:' as info;

-- Check auth users
SELECT 'AUTH USERS:' as table_name, id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com' OR id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- Check profiles
SELECT 'PROFILES:' as table_name, id, email, account_type, created_at, updated_at 
FROM profiles 
WHERE email = 'peppah.tracks@gmail.com' OR id = '861b9ca9-e89d-4478-b668-d182c1744930';

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
WHERE au.email = 'peppah.tracks@gmail.com' OR au.id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- 6. If there are still issues, clean up any duplicate peppah records
DO $$
DECLARE
  peppah_auth_count integer;
  peppah_profile_count integer;
BEGIN
  -- Count how many peppah records exist
  SELECT COUNT(*) INTO peppah_auth_count FROM auth.users WHERE email = 'peppah.tracks@gmail.com';
  SELECT COUNT(*) INTO peppah_profile_count FROM profiles WHERE email = 'peppah.tracks@gmail.com';
  
  RAISE NOTICE 'Found % auth users and % profiles for peppah.tracks@gmail.com', peppah_auth_count, peppah_profile_count;
  
  -- If there are multiple records, keep only the one with the specific ID
  IF peppah_auth_count > 1 THEN
    RAISE NOTICE 'Cleaning up duplicate auth users...';
    DELETE FROM auth.users 
    WHERE email = 'peppah.tracks@gmail.com' 
    AND id != '861b9ca9-e89d-4478-b668-d182c1744930';
    RAISE NOTICE '✅ Duplicate auth users cleaned up';
  END IF;
  
  IF peppah_profile_count > 1 THEN
    RAISE NOTICE 'Cleaning up duplicate profiles...';
    DELETE FROM profiles 
    WHERE email = 'peppah.tracks@gmail.com' 
    AND id != '861b9ca9-e89d-4478-b668-d182c1744930';
    RAISE NOTICE '✅ Duplicate profiles cleaned up';
  END IF;
END $$;

-- 7. Final verification
SELECT 'FINAL VERIFICATION:' as info;
SELECT 
  'AUTH USERS' as table_name,
  COUNT(*) as count
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com'
UNION ALL
SELECT 
  'PROFILES' as table_name,
  COUNT(*) as count
FROM profiles 
WHERE email = 'peppah.tracks@gmail.com';

-- 8. Test if the user can now sign in (this will be verified by the JavaScript test)
SELECT 'READY FOR TESTING:' as info;
SELECT 
  'peppah.tracks@gmail.com' as email,
  'Mbfpr123!' as password,
  'producer' as account_type,
  '861b9ca9-e89d-4478-b668-d182c1744930' as expected_user_id;
