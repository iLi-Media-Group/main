-- Add Terms and Conditions acceptance tracking to profiles table
-- This ensures all users (clients, producers, artists) have terms acceptance tracking

-- Add terms acceptance fields if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;

-- Add comments to explain the fields
COMMENT ON COLUMN profiles.terms_accepted IS 'Whether the user has accepted the Terms and Conditions';
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Timestamp when the user accepted the Terms and Conditions';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted ON profiles(terms_accepted);
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted_at ON profiles(terms_accepted_at);

-- Update existing users to have terms_accepted = false if not set
UPDATE profiles 
SET terms_accepted = false 
WHERE terms_accepted IS NULL;

-- Ensure terms_accepted_at is NULL for users who haven't accepted terms
UPDATE profiles 
SET terms_accepted_at = NULL 
WHERE terms_accepted = false AND terms_accepted_at IS NOT NULL;
