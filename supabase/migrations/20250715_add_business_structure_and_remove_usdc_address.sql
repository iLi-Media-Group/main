-- Add 'business_structure' column to 'profiles' table
ALTER TABLE profiles ADD COLUMN business_structure text;

-- Remove 'usdc_address' column from 'profiles' table
ALTER TABLE profiles DROP COLUMN IF EXISTS usdc_address; 