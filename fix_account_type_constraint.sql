-- Fix account_type constraint to support dual roles
-- This allows account types like 'admin,producer' for dual role users

-- First, let's see the current constraint
SELECT 'Current Constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname = 'profiles_account_type_check';

-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;

-- Add a new constraint that supports dual roles
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