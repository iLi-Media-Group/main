-- Fix ALL account_type constraints to support dual roles
-- This script finds and updates all constraints that might block 'admin,producer'

-- First, let's see ALL constraints on the profiles table
SELECT 'All Constraints on Profiles Table:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass
ORDER BY conname;

-- Find all constraints that reference account_type
SELECT 'Constraints that might affect account_type:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass
AND pg_get_constraintdef(oid) LIKE '%account_type%'
ORDER BY conname;

-- Drop all account_type related constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_account_type;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check_old;

-- Add a new comprehensive constraint that supports dual roles
ALTER TABLE profiles ADD CONSTRAINT profiles_account_type_check 
CHECK (
  account_type IN (
    'client', 
    'producer', 
    'admin', 
    'white_label',
    'admin,producer'  -- Dual role for main admin
  )
);

-- Verify the new constraint
SELECT 'Updated Constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname = 'profiles_account_type_check';

-- Now try to update the account types
UPDATE profiles 
SET account_type = 'admin,producer'
WHERE email = 'knockriobeats@gmail.com';

UPDATE profiles 
SET account_type = 'admin'
WHERE email IN ('info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- Verify the changes
SELECT 'Updated Account Types:' as info;
SELECT id, email, account_type 
FROM profiles 
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- Show all users with admin access
SELECT 'All Admin Users:' as info;
SELECT id, email, account_type, created_at
FROM profiles 
WHERE account_type LIKE '%admin%'
ORDER BY created_at DESC; 