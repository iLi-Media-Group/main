-- Add sample instruments and media_usage data to existing tracks for testing
-- This will help us verify that the Algolia search works with these fields

-- Update a few tracks with sample instruments data
UPDATE tracks 
SET instruments = ARRAY['Acoustic Guitar', 'Piano', 'Drums']
WHERE id IN (
  SELECT id FROM tracks 
  WHERE genres && ARRAY['jazz'] 
  LIMIT 3
);

-- Update a few tracks with sample media_usage data
UPDATE tracks 
SET media_usage = ARRAY['Television (TV)', 'Film & Cinema', 'Advertising & Corporate > Brand Commercials']
WHERE id IN (
  SELECT id FROM tracks 
  WHERE genres && ARRAY['ambient'] 
  LIMIT 3
);

-- Update some hip-hop tracks with instruments
UPDATE tracks 
SET instruments = ARRAY['Drums', 'Bass', 'Synthesizer']
WHERE id IN (
  SELECT id FROM tracks 
  WHERE genres && ARRAY['hip-hop'] 
  LIMIT 3
);

-- Update some pop tracks with media usage
UPDATE tracks 
SET media_usage = ARRAY['Streaming Platforms', 'YouTube & Digital Video', 'Social Media > Short-form Video']
WHERE id IN (
  SELECT id FROM tracks 
  WHERE genres && ARRAY['pop'] 
  LIMIT 3
);

-- Show the updated tracks
SELECT 
  id,
  title,
  genres,
  instruments,
  media_usage
FROM tracks 
WHERE (instruments IS NOT NULL AND array_length(instruments, 1) > 0) 
   OR (media_usage IS NOT NULL AND array_length(media_usage, 1) > 0)
LIMIT 10;
