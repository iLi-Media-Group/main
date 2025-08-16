-- Manually test the Edge Function with a recent track
-- This will help us see if the Edge Function is working correctly

-- Get the most recent track for testing
WITH recent_track AS (
    SELECT 
        id as track_id,
        title,
        track_producer_id as producer_id,
        created_at
    FROM tracks 
    WHERE track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
    ORDER BY created_at DESC 
    LIMIT 1
)
SELECT 
    track_id,
    producer_id,
    title,
    created_at,
    'https://yciqkebqlajqbpwlujma.supabase.co/functions/v1/send-producer-track-notification' as edge_function_url
FROM recent_track;

-- This will show you the track details and the Edge Function URL
-- You can then manually test the Edge Function by making a POST request to that URL
-- with the track_id and producer_id as JSON body
