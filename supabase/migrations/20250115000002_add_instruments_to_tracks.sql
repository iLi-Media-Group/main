-- Add instruments column to tracks table
-- This migration adds instruments support for better search functionality

-- Add instruments column to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS instruments TEXT[] DEFAULT '{}';

-- Create an index for instruments to improve search performance
CREATE INDEX IF NOT EXISTS idx_tracks_instruments ON tracks USING GIN (instruments);

-- Add comment to document the instruments column
COMMENT ON COLUMN tracks.instruments IS 'Array of instruments used in the track for search and filtering purposes';

-- Update RLS policies to include instruments in search
-- (No changes needed to existing policies as instruments will be included in SELECT operations)
