-- Add is_sync_only column to tracks table
-- This column indicates that the track is only available for sync proposals, not for regular licensing

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tracks' AND column_name='is_sync_only'
  ) THEN
    ALTER TABLE tracks ADD COLUMN is_sync_only BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add comment to explain the column
COMMENT ON COLUMN tracks.is_sync_only IS 'Indicates that this track is only available for sync proposals, not for regular licensing';

-- Update RLS policies to consider is_sync_only when filtering tracks
-- This ensures sync-only tracks are not shown in regular catalog browsing
CREATE OR REPLACE FUNCTION public.get_visible_tracks(user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  artist TEXT,
  genres TEXT,
  sub_genres TEXT,
  moods TEXT[],
  media_usage TEXT[],
  bpm INTEGER,
  key TEXT,
  has_sting_ending BOOLEAN,
  is_one_stop BOOLEAN,
  audio_url TEXT,
  image_url TEXT,
  mp3_url TEXT,
  trackouts_url TEXT,
  stems_url TEXT,
  split_sheet_url TEXT,
  has_vocals BOOLEAN,
  vocals_usage_type TEXT,
  is_sync_only BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.artist,
    t.genres,
    t.sub_genres,
    t.moods,
    t.media_usage,
    t.bpm,
    t.key,
    t.has_sting_ending,
    t.is_one_stop,
    t.audio_url,
    t.image_url,
    t.mp3_url,
    t.trackouts_url,
    t.stems_url,
    t.split_sheet_url,
    t.has_vocals,
    t.vocals_usage_type,
    t.is_sync_only,
    t.created_at,
    t.updated_at
  FROM tracks t
  WHERE 
    -- Show all tracks to producers (track owners)
    t.track_producer_id = user_id
    OR
    -- For clients, only show tracks that are not sync-only
    (t.is_sync_only = FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 