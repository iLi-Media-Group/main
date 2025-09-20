-- Complete Peppah Cleanup and Recreation
-- This script will completely remove all traces of peppah and recreate from scratch

-- 1. First, let's see what exists (should be nothing visible)
SELECT 'CURRENT STATE - SHOULD BE EMPTY:' as info;

SELECT 'AUTH USERS:' as table_name, id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com' OR id = '861b9ca9-e89d-4478-b668-d182c1744930';

SELECT 'PROFILES:' as table_name, id, email, account_type, created_at, updated_at 
FROM profiles 
WHERE email = 'peppah.tracks@gmail.com' OR id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- 2. Check what columns actually exist in producer_balances
SELECT 'CHECKING PRODUCER_BALANCES COLUMNS:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'producer_balances' AND table_schema = 'public';

-- 3. Check what columns actually exist in producer_invitations
SELECT 'CHECKING PRODUCER_INVITATIONS COLUMNS:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'producer_invitations' AND table_schema = 'public';

-- 4. Check for any foreign key references that might be blocking us
SELECT 'CHECKING FOR FOREIGN KEY REFERENCES:' as info;

-- Check producer_balances table (using correct column name)
SELECT 'PRODUCER_BALANCES:' as table_name, id, available_balance 
FROM producer_balances 
WHERE id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- Check producer_invitations table (using correct column name)
SELECT 'PRODUCER_INVITATIONS:' as table_name, id, producer_number 
FROM producer_invitations 
WHERE id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- Check any other tables that might reference this user
SELECT 'OTHER TABLES WITH USER REFERENCES:' as info;
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name LIKE '%user%' OR column_name LIKE '%producer%' OR column_name LIKE '%profile%'
AND table_schema = 'public'
AND table_name NOT IN ('profiles', 'producer_balances', 'producer_invitations');

-- 5. Clean up any remaining references
SELECT 'CLEANING UP REFERENCES:' as info;

-- Delete from producer_balances if exists (using correct column name)
DELETE FROM producer_balances WHERE id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- Delete from producer_invitations if exists (using correct column name)
DELETE FROM producer_invitations WHERE id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- 6. Force delete any remaining auth user (if it exists in a hidden state)
SELECT 'FORCE CLEANING AUTH USERS:' as info;
DELETE FROM auth.users WHERE email = 'peppah.tracks@gmail.com' OR id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- 7. Force delete any remaining profile (if it exists in a hidden state)
SELECT 'FORCE CLEANING PROFILES:' as info;
DELETE FROM profiles WHERE email = 'peppah.tracks@gmail.com' OR id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- 8. Check if we have a clean slate
SELECT 'AFTER CLEANUP - SHOULD BE EMPTY:' as info;

SELECT 'AUTH USERS:' as table_name, id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com' OR id = '861b9ca9-e89d-4478-b668-d182c1744930';

SELECT 'PROFILES:' as table_name, id, email, account_type, created_at, updated_at 
FROM profiles 
WHERE email = 'peppah.tracks@gmail.com' OR id = '861b9ca9-e89d-4478-b668-d182c1744930';

-- 9. Now create a completely fresh user with a NEW UUID
SELECT 'CREATING FRESH USER:' as info;

DO $$
DECLARE
  fresh_user_id uuid;
BEGIN
  -- Generate a completely new UUID (different from the old one)
  fresh_user_id := gen_random_uuid();
  
  RAISE NOTICE 'Creating completely fresh user with NEW ID: %', fresh_user_id;
  
  -- Create the auth user with the new UUID
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
  
  RAISE NOTICE '✅ Fresh auth user created with ID: %', fresh_user_id;
  
  -- Create the profile with the new UUID
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
  
  RAISE NOTICE '✅ Fresh profile created with ID: %', fresh_user_id;
  
  -- Store the new ID for verification
  PERFORM set_config('peppah.fresh_user_id', fresh_user_id::text, false);
END $$;

-- 10. Get the new user ID
SELECT 'NEW USER ID:' as info, current_setting('peppah.fresh_user_id') as fresh_user_id;

-- 11. Final verification
SELECT 'FINAL VERIFICATION:' as info;

SELECT 'AUTH USERS:' as table_name, id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com';

SELECT 'PROFILES:' as table_name, id, email, account_type, created_at, updated_at 
FROM profiles 
WHERE email = 'peppah.tracks@gmail.com';

-- 12. Test the linkage
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

-- 13. Ready for testing
SELECT 'READY FOR TESTING:' as info;
SELECT 
  'peppah.tracks@gmail.com' as email,
  'Mbfpr123!' as password,
  'producer' as account_type,
  au.id as user_id
FROM auth.users au
WHERE au.email = 'peppah.tracks@gmail.com';
