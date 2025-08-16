-- Test Edge Function environment variables
-- This will help us check if the function can access the database

-- Check if the function can access the database by testing a simple query
-- This will help us verify if the service role key is working

-- Test basic database access
SELECT 
    'Database connection test' as test_name,
    current_timestamp as test_time,
    COUNT(*) as total_tracks
FROM tracks;

-- Test if we can access the specific track
SELECT 
    id,
    title,
    track_producer_id
FROM tracks 
WHERE id = '05e5e2b7-e98f-4777-b114-822a7a65b9e4';

-- Test if we can access the producer profile
SELECT 
    id,
    first_name,
    last_name,
    email,
    company_name
FROM profiles 
WHERE id = '83e21f94-aced-452a-bafb-6eb9629e3b18';

-- Test if we can access the followers
SELECT 
    pf.producer_id,
    pf.follower_id,
    pf.email_notifications_enabled,
    f.email as follower_email
FROM producer_follows pf
JOIN profiles f ON pf.follower_id = f.id
WHERE pf.producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
AND pf.email_notifications_enabled = true;
