-- Convert tracks table columns from text to text[] arrays for better search functionality

-- 1) Add new array columns
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS genres_arr text[];
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS sub_genres_arr text[];
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS moods_arr text[];
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS instruments_arr text[];
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS media_usage_arr text[];

-- 2) Convert existing text columns to arrays
UPDATE public.tracks
SET genres_arr = CASE
  WHEN genres IS NULL OR trim(genres) = '' THEN ARRAY[]::text[]
  ELSE array_remove(ARRAY(SELECT trim(x) FROM unnest(string_to_array(genres, ',')) AS x), '')
END;

UPDATE public.tracks
SET sub_genres_arr = CASE
  WHEN sub_genres IS NULL OR trim(sub_genres) = '' THEN ARRAY[]::text[]
  ELSE array_remove(ARRAY(SELECT trim(x) FROM unnest(string_to_array(sub_genres, ',')) AS x), '')
END;

UPDATE public.tracks
SET moods_arr = CASE
  WHEN moods IS NULL OR trim(moods) = '' THEN ARRAY[]::text[]
  ELSE array_remove(ARRAY(SELECT trim(x) FROM unnest(string_to_array(moods, ',')) AS x), '')
END;

UPDATE public.tracks
SET instruments_arr = CASE
  WHEN instruments IS NULL OR trim(instruments) = '' THEN ARRAY[]::text[]
  ELSE array_remove(ARRAY(SELECT trim(x) FROM unnest(string_to_array(instruments, ',')) AS x), '')
END;

UPDATE public.tracks
SET media_usage_arr = CASE
  WHEN media_usage IS NULL OR trim(media_usage) = '' THEN ARRAY[]::text[]
  ELSE array_remove(ARRAY(SELECT trim(x) FROM unnest(string_to_array(media_usage, ',')) AS x), '')
END;

-- 3) Create indexes for the new array columns
CREATE INDEX IF NOT EXISTS idx_tracks_genres_arr ON public.tracks USING GIN (genres_arr);
CREATE INDEX IF NOT EXISTS idx_tracks_sub_genres_arr ON public.tracks USING GIN (sub_genres_arr);
CREATE INDEX IF NOT EXISTS idx_tracks_moods_arr ON public.tracks USING GIN (moods_arr);
CREATE INDEX IF NOT EXISTS idx_tracks_instruments_arr ON public.tracks USING GIN (instruments_arr);
CREATE INDEX IF NOT EXISTS idx_tracks_media_usage_arr ON public.tracks USING GIN (media_usage_arr);

-- 4) Add comments for documentation
COMMENT ON COLUMN public.tracks.genres_arr IS 'Array version of genres for efficient search queries';
COMMENT ON COLUMN public.tracks.sub_genres_arr IS 'Array version of sub_genres for efficient search queries';
COMMENT ON COLUMN public.tracks.moods_arr IS 'Array version of moods for efficient search queries';
COMMENT ON COLUMN public.tracks.instruments_arr IS 'Array version of instruments for efficient search queries';
COMMENT ON COLUMN public.tracks.media_usage_arr IS 'Array version of media_usage for efficient search queries';
