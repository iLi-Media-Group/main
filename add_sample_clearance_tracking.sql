-- Add sample clearance tracking fields to tracks table
-- This will track if tracks contain samples that need clearance

-- Add the new fields to tracks table
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS contains_loops BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contains_samples BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS samples_cleared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sample_clearance_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN tracks.contains_loops IS 'Whether the track contains loops that need clearance';
COMMENT ON COLUMN tracks.contains_samples IS 'Whether the track contains samples that need clearance';
COMMENT ON COLUMN tracks.samples_cleared IS 'Whether all samples in the track have been cleared for use';
COMMENT ON COLUMN tracks.sample_clearance_notes IS 'Notes about sample clearance status and details';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tracks_sample_clearance 
ON tracks(contains_samples, samples_cleared);

-- Update existing tracks to have default values
UPDATE tracks 
SET 
    contains_loops = COALESCE(contains_loops, false),
    contains_samples = COALESCE(contains_samples, false),
    samples_cleared = COALESCE(samples_cleared, false)
WHERE contains_loops IS NULL OR contains_samples IS NULL OR samples_cleared IS NULL;
