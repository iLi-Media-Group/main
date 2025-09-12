-- Apply Sample Clearance Migration
-- This adds the missing columns that are causing the tracks query to fail

-- Add the new fields to tracks table
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS contains_loops BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contains_samples BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contains_splice_loops BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS samples_cleared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sample_clearance_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN tracks.contains_loops IS 'Whether the track contains loops that need clearance';
COMMENT ON COLUMN tracks.contains_samples IS 'Whether the track contains samples that need clearance';
COMMENT ON COLUMN tracks.contains_splice_loops IS 'Whether the track contains Splice loops that need clearance';
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
    contains_splice_loops = COALESCE(contains_splice_loops, false),
    samples_cleared = COALESCE(samples_cleared, false)
WHERE contains_loops IS NULL OR contains_samples IS NULL OR contains_splice_loops IS NULL OR samples_cleared IS NULL;

-- Verify the columns were added successfully
SELECT 'Sample clearance columns added successfully!' as status;

-- Test that tracks can now be queried
SELECT 'Testing track visibility after migration:' as info;
SELECT COUNT(*) as total_tracks FROM tracks;

-- Show the new columns in the tracks table
SELECT 'New columns in tracks table:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
    AND table_schema = 'public'
    AND column_name IN ('contains_loops', 'contains_samples', 'contains_splice_loops', 'samples_cleared', 'sample_clearance_notes')
ORDER BY column_name;

-- Migration completed successfully!
SELECT 'Sample clearance migration completed! Clients should now be able to see tracks.' as final_status;
