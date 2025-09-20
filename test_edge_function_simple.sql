-- Simple test to check Edge Function accessibility
-- This will help us verify the basic function is working

-- First, let's check if the trigger is being called at all
SELECT * FROM trigger_debug_log 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if there are any followers with email notifications enabled
SELECT 
    pf.producer_id,
    pf.follower_id,
    pf.email_notifications_enabled,
    p.first_name as producer_first_name,
    p.last_name as producer_last_name,
    f.email as follower_email
FROM producer_follows pf
JOIN profiles p ON pf.producer_id = p.id
JOIN profiles f ON pf.follower_id = f.id
WHERE pf.email_notifications_enabled = true
AND pf.producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18';

-- Check if the get_producer_followers function works
SELECT * FROM get_producer_followers('83e21f94-aced-452a-bafb-6eb9629e3b18'::uuid, 1000);

-- Check recent track uploads to see if triggers should have fired
SELECT 
    id,
    title,
    track_producer_id,
    created_at
FROM tracks 
WHERE track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
ORDER BY created_at DESC 
LIMIT 3;
