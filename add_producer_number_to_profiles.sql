-- Add producer_number column to profiles table
-- Run this in Supabase SQL Editor

-- Check if producer_number column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'producer_number';

-- Add producer_number column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS producer_number VARCHAR(50);

-- Update existing producer profiles with their producer number
-- This will get the producer number from the invitation that was used
UPDATE profiles 
SET producer_number = (
  SELECT pi.producer_number 
  FROM producer_invitations pi 
  WHERE pi.invitation_code = profiles.invitation_code
  AND pi.email = profiles.email
)
WHERE profiles.account_type = 'producer' 
  AND profiles.producer_number IS NULL
  AND profiles.invitation_code IS NOT NULL;

-- Show the results
SELECT 
  id,
  email,
  first_name,
  last_name,
  account_type,
  producer_number,
  invitation_code
FROM profiles 
WHERE account_type = 'producer'
ORDER BY created_at DESC;
