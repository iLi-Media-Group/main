-- Check if tracks have instruments and media_usage data
SELECT 
  COUNT(*) as total_tracks,
  COUNT(CASE WHEN instruments IS NOT NULL AND array_length(instruments, 1) > 0 THEN 1 END) as tracks_with_instruments,
  COUNT(CASE WHEN media_usage IS NOT NULL AND array_length(media_usage, 1) > 0 THEN 1 END) as tracks_with_media_usage,
  COUNT(CASE WHEN instruments IS NOT NULL AND array_length(instruments, 1) > 0 AND media_usage IS NOT NULL AND array_length(media_usage, 1) > 0 THEN 1 END) as tracks_with_both
FROM tracks;

-- Show sample tracks with instruments data
SELECT 
  id,
  title,
  instruments,
  array_length(instruments, 1) as instrument_count
FROM tracks 
WHERE instruments IS NOT NULL AND array_length(instruments, 1) > 0
LIMIT 5;

-- Show sample tracks with media_usage data
SELECT 
  id,
  title,
  media_usage,
  array_length(media_usage, 1) as media_usage_count
FROM tracks 
WHERE media_usage IS NOT NULL AND array_length(media_usage, 1) > 0
LIMIT 5;
