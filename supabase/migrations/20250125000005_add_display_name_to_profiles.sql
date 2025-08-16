-- Add display_name column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name text;

-- Add comment to document the column purpose
COMMENT ON COLUMN profiles.display_name IS 'Display name/artist name for producers, falls back to first_name if not set';

-- Update existing records to have display_name as first_name if not set
UPDATE profiles 
SET display_name = first_name 
WHERE display_name IS NULL AND first_name IS NOT NULL;
