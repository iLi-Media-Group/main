-- Check if the track ID exists in the database
-- This will help us verify if the track is still there

-- Check if the specific track exists
SELECT 
    id,
    title,
    track_producer_id,
    created_at
FROM tracks 
WHERE id = 'ad456545-bd4c-43fc-a37d-0d84867e4e33';

-- Check recent tracks to see what's available
SELECT 
    id,
    title,
    track_producer_id,
    created_at
FROM tracks 
WHERE track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
ORDER BY created_at DESC 
LIMIT 5;

-- Check the debug log to see when the trigger was called
SELECT * FROM trigger_debug_log 
ORDER BY created_at DESC 
LIMIT 5;
