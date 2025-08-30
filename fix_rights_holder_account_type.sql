-- Fix account_type constraint to include rights_holder
-- This allows rights holder applications to create proper profiles

-- First, check the current constraint and default
SELECT 'Current Constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname = 'profiles_account_type_check';

SELECT 'Current Default:' as info;
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'account_type';

-- Remove the DEFAULT 'client' constraint that's causing the issue
ALTER TABLE profiles ALTER COLUMN account_type DROP DEFAULT;

-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;

-- Add a new constraint that includes rights_holder
ALTER TABLE profiles ADD CONSTRAINT profiles_account_type_check 
CHECK (
  account_type IN (
    'client', 
    'producer', 
    'admin', 
    'white_label',
    'admin,producer',
    'rights_holder',
    'artist_band'
  )
);

-- Verify the new constraint
SELECT 'Updated Constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname = 'profiles_account_type_check';

-- Verify the default is removed
SELECT 'Updated Default:' as info;
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'account_type';

-- Test that rights_holder is now valid
SELECT 'Testing rights_holder account type:' as info;
SELECT 'rights_holder'::text = ANY(ARRAY['client', 'producer', 'admin', 'white_label', 'admin,producer', 'rights_holder', 'artist_band']) as is_valid;
