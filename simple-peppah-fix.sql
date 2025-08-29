-- Simple Peppah Fix
-- This script simply updates existing records to fix the peppah user

-- 1. First, let's see what exists
SELECT 'CURRENT STATE:' as info;

SELECT 'AUTH USERS:' as table_name, id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com' OR id = '861b9ca9-e89d-4478-b668-d182c1744930';

SELECT 'PROFILES:' as table_name, id, email, account_type, created_at, updated_at 
FROM profiles 
WHERE email = 'peppah.tracks@gmail.com' OR id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- 2. Simple fix: Update existing records to be peppah.tracks@gmail.com
-- Update the profile if it exists
UPDATE profiles 
SET email = 'peppah.tracks@gmail.com',
    account_type = 'producer',
    updated_at = now()
WHERE id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- Update the auth user if it exists
UPDATE auth.users 
SET email = 'peppah.tracks@gmail.com',
    raw_user_meta_data = '{"account_type":"producer"}',
    updated_at = now()
WHERE id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- 3. If auth user doesn't exist, create it
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
) 
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE id = '861b9ca9-e89d-4478-b668-d182c1744930'
);

-- 4. If profile doesn't exist, create it
INSERT INTO profiles (
  id,
  email,
  account_type,
  created_at,
  updated_at
)
SELECT 
  '861b9ca9-e89d-4478-b668-d182c1744930',
  'peppah.tracks@gmail.com',
  'producer',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE id = '861b9ca9-e89d-4478-b668-d182c1744930'
);

-- 5. Verify the fix worked
SELECT 'AFTER FIX:' as info;

SELECT 'AUTH USERS:' as table_name, id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com' OR id = '861b9ca9-e89d-4478-b668-d182c1744930';

SELECT 'PROFILES:' as table_name, id, email, account_type, created_at, updated_at 
FROM profiles 
WHERE email = 'peppah.tracks@gmail.com' OR id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- 6. Test the linkage
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

-- 7. Ready for testing
SELECT 'READY FOR TESTING:' as info;
SELECT 
  'peppah.tracks@gmail.com' as email,
  'Mbfpr123!' as password,
  'producer' as account_type,
  '861b9ca9-e89d-4478-b668-d182c1744930' as expected_user_id;
