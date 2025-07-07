-- Migration: Add white_label as a valid account_type in profiles table
-- This allows white label clients to be properly categorized

-- First, drop the existing check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;

-- Add the new check constraint that includes 'white_label'
ALTER TABLE profiles ADD CONSTRAINT profiles_account_type_check 
CHECK (account_type IN ('client', 'producer', 'admin', 'white_label'));

-- Add comment to document the new account type
COMMENT ON COLUMN profiles.account_type IS 'Type of account: client, producer, admin, or white_label'; 