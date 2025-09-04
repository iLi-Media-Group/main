-- Cleanup Query - Strip out signed URLs and keep only the storage path
-- This will scan your tracks.image column for anything that looks like a signed URL, 
-- and convert it into the correct public storage path.

-- Cleanup SQL -- Strip out signed URLs and keep only the storage path
UPDATE tracks
SET image = regexp_replace(
    image,
    '^.+/track-images/',  -- remove everything before /track-images/
    ''
)
WHERE image LIKE '%/object/sign/track-images/%';

-- Example:
-- Before: https://.../storage/v1/object/sign/track-images/83e21f94-aced-452a-bafb-6eb9629e3b18/SMOKE%20AND%20DRANK/cover.jpg?token=abcdef
-- After: 83e21f94-aced-452a-bafb-6eb9629e3b18/SMOKE AND DRANK/cover.jpg
-- Which is exactly what your TrackImage.tsx builds into the correct public URL.

-- ✅ Optional safeguard (for new inserts)
-- If you want to auto-clean on insert/update, you can create a trigger in Postgres:

CREATE OR REPLACE FUNCTION normalize_track_image()
RETURNS trigger AS $$
BEGIN
  IF NEW.image LIKE '%/object/sign/track-images/%' THEN
    NEW.image := regexp_replace(NEW.image, '^.+/track-images/', '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS normalize_track_image_trigger ON tracks;

CREATE TRIGGER normalize_track_image_trigger
BEFORE INSERT OR UPDATE OF image ON tracks
FOR EACH ROW
EXECUTE FUNCTION normalize_track_image();

-- That way, even if your app accidentally saves a signed URL in the future, 
-- the DB will automatically clean it before storing.
