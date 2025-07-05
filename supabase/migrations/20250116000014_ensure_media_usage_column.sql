-- Migration: Ensure media_usage column exists in tracks table
-- This migration will add the column if it doesn't exist, or do nothing if it already exists

DO $$ 
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tracks' 
        AND column_name = 'media_usage'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE tracks ADD COLUMN media_usage TEXT[] DEFAULT '{}';
        
        -- Add index for media_usage column for better query performance
        CREATE INDEX IF NOT EXISTS idx_tracks_media_usage ON tracks USING GIN (media_usage);
        
        -- Add comment for documentation
        COMMENT ON COLUMN tracks.media_usage IS 'Array of media usage types for deep media search (e.g., "Television (TV) > Reality TV > Competition Shows")';
    END IF;
END $$; 