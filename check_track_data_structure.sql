-- Check track data structure and values for email debugging
SELECT 
    'Track data for email debugging' as test_info,
    id,
    title,
    genres,
    sub_genres,
    bpm,
    key,
    duration,
    track_producer_id,
    created_at
FROM tracks 
WHERE track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
ORDER BY created_at DESC 
LIMIT 1;

-- Check data types of the columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
AND column_name IN ('genres', 'sub_genres', 'duration', 'bpm', 'key')
ORDER BY column_name;
