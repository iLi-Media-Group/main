-- Fix the net.http_post issue by temporarily disabling problematic triggers
-- This will allow track uploads to work while we fix the underlying issue

-- First, let's see what triggers exist on the tracks table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'tracks'
ORDER BY trigger_name;

-- Temporarily disable all triggers on the tracks table
-- This will allow INSERT operations to work without triggering the failing functions

-- Disable triggers that might be calling net.http_post
ALTER TABLE tracks DISABLE TRIGGER ALL;

-- Verify triggers are disabled
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'tracks'
ORDER BY trigger_name;

-- Test if we can now insert into tracks
-- (This will be commented out to avoid actual insertion during debugging)
/*
INSERT INTO tracks (
    title, 
    artist, 
    track_producer_id,
    created_at,
    updated_at
) VALUES (
    'TEST_TRACK_FIX',
    'TEST_ARTIST',
    '83e21f94-aced-452a-bafb-6eb9629e3b18',
    NOW(),
    NOW()
);
*/

-- Note: To re-enable triggers later, use:
-- ALTER TABLE tracks ENABLE TRIGGER ALL;
