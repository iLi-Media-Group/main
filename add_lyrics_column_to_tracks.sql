-- Add lyrics column to tracks table
-- This allows producers to include song lyrics with their track uploads

ALTER TABLE tracks ADD COLUMN IF NOT EXISTS lyrics TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN tracks.lyrics IS 'Song lyrics text content for tracks with vocals';
