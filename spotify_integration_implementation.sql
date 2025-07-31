-- Spotify Integration Database Migration
-- Add Spotify-related fields to tracks table for enhanced preview functionality

-- Add Spotify-related columns to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS spotify_track_id TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS spotify_preview_url TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS spotify_external_url TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS use_spotify_preview BOOLEAN DEFAULT false;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS spotify_search_attempted BOOLEAN DEFAULT false;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS spotify_last_searched TIMESTAMP WITH TIME ZONE;

-- Create index for Spotify track ID lookups
CREATE INDEX IF NOT EXISTS idx_tracks_spotify_track_id ON tracks(spotify_track_id);

-- Create index for Spotify preview usage
CREATE INDEX IF NOT EXISTS idx_tracks_use_spotify_preview ON tracks(use_spotify_preview);

-- Add constraint to ensure Spotify preview URL is valid when used
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_spotify_preview_url' 
        AND table_name = 'tracks'
    ) THEN
        ALTER TABLE tracks ADD CONSTRAINT valid_spotify_preview_url 
        CHECK (
          (use_spotify_preview = false) OR 
          (use_spotify_preview = true AND spotify_preview_url IS NOT NULL AND spotify_preview_url != '')
        );
    END IF;
END $$;

-- Create a view for tracks with Spotify previews
CREATE OR REPLACE VIEW tracks_with_spotify_previews AS
SELECT 
  id,
  title,
  artist,
  spotify_track_id,
  spotify_preview_url,
  spotify_external_url,
  use_spotify_preview,
  audio_url as mp3_url,
  created_at
FROM tracks 
WHERE use_spotify_preview = true 
AND spotify_preview_url IS NOT NULL;

-- Create a function to update Spotify preview status
CREATE OR REPLACE FUNCTION update_spotify_preview_status(
  track_id UUID,
  spotify_id TEXT,
  preview_url TEXT,
  external_url TEXT,
  use_preview BOOLEAN
) RETURNS VOID AS $$
BEGIN
  UPDATE tracks 
  SET 
    spotify_track_id = spotify_id,
    spotify_preview_url = preview_url,
    spotify_external_url = external_url,
    use_spotify_preview = use_preview,
    spotify_search_attempted = true,
    spotify_last_searched = NOW(),
    updated_at = NOW()
  WHERE id = track_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to search for tracks without Spotify data
CREATE OR REPLACE VIEW tracks_needing_spotify_search AS
SELECT 
  id,
  title,
  artist,
  created_at
FROM tracks 
WHERE spotify_search_attempted = false 
OR (spotify_search_attempted = true AND spotify_track_id IS NULL);

-- Verify the migration
SELECT '=== SPOTIFY INTEGRATION MIGRATION COMPLETE ===' as info;

SELECT '=== TRACKS WITH SPOTIFY PREVIEWS ===' as info;
SELECT COUNT(*) as count FROM tracks WHERE use_spotify_preview = true;

SELECT '=== TRACKS NEEDING SPOTIFY SEARCH ===' as info;
SELECT COUNT(*) as count FROM tracks_needing_spotify_search;

SELECT '=== SAMPLE TRACKS ===' as info;
SELECT 
  title,
  artist,
  use_spotify_preview,
  spotify_track_id IS NOT NULL as has_spotify_id,
  spotify_preview_url IS NOT NULL as has_preview_url
FROM tracks 
ORDER BY created_at DESC 
LIMIT 5; 