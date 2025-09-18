-- Test Edge Function environment variables
-- This will help us verify if the RESEND_API_KEY is accessible

-- First, let's check if we have any recent track uploads to test with
SELECT 
    'Recent track for testing' as test_info,
    id as track_id,
    title,
    track_producer_id as producer_id,
    created_at
FROM tracks 
WHERE track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
ORDER BY created_at DESC 
LIMIT 1;

-- Check if the trigger is working and logging
SELECT 
    'Recent trigger logs' as test_info,
    function_name,
    track_id,
    producer_id,
    has_followers,
    created_at
FROM trigger_debug_log 
ORDER BY created_at DESC 
LIMIT 3;

-- Check if we have followers with email notifications enabled
SELECT 
    'Followers with notifications' as test_info,
    pf.producer_id,
    pf.follower_id,
    pf.email_notifications_enabled,
    p.first_name || ' ' || p.last_name as producer_name
FROM producer_follows pf
JOIN profiles p ON pf.producer_id = p.id
WHERE pf.email_notifications_enabled = true;
