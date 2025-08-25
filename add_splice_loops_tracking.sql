-- Add Splice loops tracking field to tracks table
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS contains_splice_loops BOOLEAN DEFAULT false;

COMMENT ON COLUMN tracks.contains_splice_loops IS 'Whether the track contains Splice loops that need clearance';

-- Update existing records to have default value
UPDATE tracks
SET contains_splice_loops = COALESCE(contains_splice_loops, false)
WHERE contains_splice_loops IS NULL;
