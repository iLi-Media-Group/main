-- Add Sample Clearance Fields to Tracks and Profiles Tables
-- This migration adds the missing columns that are causing the search to fail

-- Add the new fields to tracks table
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS contains_loops BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contains_samples BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contains_splice_loops BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS samples_cleared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sample_clearance_notes TEXT;

-- Add the new fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS uses_loops BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS uses_samples BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS uses_splice BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN tracks.contains_loops IS 'Whether the track contains loops that need clearance';
COMMENT ON COLUMN tracks.contains_samples IS 'Whether the track contains samples that need clearance';
COMMENT ON COLUMN tracks.contains_splice_loops IS 'Whether the track contains splice loops that need clearance';
COMMENT ON COLUMN tracks.samples_cleared IS 'Whether all samples in the track have been cleared';
COMMENT ON COLUMN tracks.sample_clearance_notes IS 'Notes about sample clearance status';

COMMENT ON COLUMN profiles.uses_loops IS 'Whether the producer typically uses loops';
COMMENT ON COLUMN profiles.uses_samples IS 'Whether the producer typically uses samples';
COMMENT ON COLUMN profiles.uses_splice IS 'Whether the producer typically uses splice loops';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tracks_contains_loops ON tracks(contains_loops);
CREATE INDEX IF NOT EXISTS idx_tracks_contains_samples ON tracks(contains_samples);
CREATE INDEX IF NOT EXISTS idx_tracks_contains_splice_loops ON tracks(contains_splice_loops);
CREATE INDEX IF NOT EXISTS idx_tracks_samples_cleared ON tracks(samples_cleared);

CREATE INDEX IF NOT EXISTS idx_profiles_uses_loops ON profiles(uses_loops);
CREATE INDEX IF NOT EXISTS idx_profiles_uses_samples ON profiles(uses_samples);
CREATE INDEX IF NOT EXISTS idx_profiles_uses_splice ON profiles(uses_splice);

-- Update existing tracks to have default values
UPDATE tracks SET 
  contains_loops = false,
  contains_samples = false,
  contains_splice_loops = false,
  samples_cleared = false
WHERE contains_loops IS NULL 
   OR contains_samples IS NULL 
   OR contains_splice_loops IS NULL 
   OR samples_cleared IS NULL;

-- Update existing profiles to have default values
UPDATE profiles SET 
  uses_loops = false,
  uses_samples = false,
  uses_splice = false
WHERE uses_loops IS NULL 
   OR uses_samples IS NULL 
   OR uses_splice IS NULL;
