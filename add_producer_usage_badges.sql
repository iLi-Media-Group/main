-- Add producer usage badge fields to profiles table
-- This will allow tracking which producers use loops, samples, or Splice

-- Add the new fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS uses_loops BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS uses_samples BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS uses_splice BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN profiles.uses_loops IS 'Whether the producer uses loops in their music production';
COMMENT ON COLUMN profiles.uses_samples IS 'Whether the producer uses samples in their music production';
COMMENT ON COLUMN profiles.uses_splice IS 'Whether the producer uses Splice for music production';

-- Create an index for efficient querying of producers with specific usage types
CREATE INDEX IF NOT EXISTS idx_profiles_usage_badges 
ON profiles(uses_loops, uses_samples, uses_splice) 
WHERE account_type = 'producer';

-- Update existing profiles to have default values
UPDATE profiles 
SET 
    uses_loops = COALESCE(uses_loops, false),
    uses_samples = COALESCE(uses_samples, false),
    uses_splice = COALESCE(uses_splice, false)
WHERE account_type = 'producer';
