-- Add media_usage column to tracks table for deep media search feature
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS media_usage TEXT[] DEFAULT '{}';

-- Add index for media_usage column for better query performance
CREATE INDEX IF NOT EXISTS idx_tracks_media_usage ON tracks USING GIN (media_usage);

-- Add comment to document the column
COMMENT ON COLUMN tracks.media_usage IS 'Array of media usage types for deep media search (e.g., "Television (TV) > Reality TV > Competition Shows")'; 