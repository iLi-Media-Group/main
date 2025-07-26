-- Fix ALL account_type constraints to support dual roles
-- This allows account types like 'admin,producer' for dual role users

-- Drop all possible account_type related constraints
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

-- Update account types for admin users
UPDATE profiles 
SET account_type = 'admin,producer'
WHERE email = 'knockriobeats@gmail.com';

UPDATE profiles 
SET account_type = 'admin'
WHERE email IN ('info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com'); 