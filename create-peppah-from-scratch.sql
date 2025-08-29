-- Create Peppah User From Scratch
-- Since the record was deleted, we'll create it fresh

-- 1. First, let's check if there are any existing peppah records
SELECT 'CHECKING FOR EXISTING PEPPAH RECORDS:' as info;

SELECT 'AUTH USERS:' as table_name, id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com';

SELECT 'PROFILES:' as table_name, id, email, account_type, created_at, updated_at 
FROM profiles 
WHERE email = 'peppah.tracks@gmail.com';

-- 2. Create a fresh auth user for peppah
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();
  
  RAISE NOTICE 'Creating fresh auth user for peppah.tracks@gmail.com with ID: %', new_user_id;
  
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
    new_user_id,
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
  
  RAISE NOTICE '✅ Auth user created successfully with ID: %', new_user_id;
  
  -- Create the profile
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
  
  RAISE NOTICE '✅ Profile created successfully with ID: %', new_user_id;
  
  -- Store the ID for verification
  PERFORM set_config('peppah.user_id', new_user_id::text, false);
END $$;

-- 3. Get the created user ID
SELECT 'CREATED USER ID:' as info, current_setting('peppah.user_id') as user_id;

-- 4. Verify the user was created
SELECT 'VERIFICATION:' as info;

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
