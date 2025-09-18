-- Fix the trigger and ensure it's properly configured
-- This will ensure the email notification trigger works correctly

-- First, let's check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'tracks'
AND trigger_name LIKE '%notification%';

-- Check if the handle_track_upload_notification function exists
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_track_upload_notification';

-- Update the function to use the correct table name and add debugging
CREATE OR REPLACE FUNCTION handle_track_upload_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_producer_id UUID;
    v_has_followers BOOLEAN;
BEGIN
    -- Only trigger for new tracks (not updates)
    IF TG_OP = 'INSERT' THEN
        v_producer_id := NEW.track_producer_id;
        
        -- Check if the producer has any followers with email notifications enabled
        SELECT EXISTS(
            SELECT 1 
            FROM producer_follows 
            WHERE producer_id = v_producer_id 
            AND email_notifications_enabled = true
        ) INTO v_has_followers;
        
        -- Log the function call for debugging
        INSERT INTO trigger_debug_log (function_name, track_id, producer_id, has_followers)
        VALUES ('handle_track_upload_notification', NEW.id, v_producer_id, v_has_followers);
        
        -- If producer has followers with notifications enabled, call the Edge Function
        IF v_has_followers THEN
            -- Call the Edge Function asynchronously
            PERFORM net.http_post(
                url := 'https://yciqkebqlajqbpwlujma.supabase.co/functions/v1/send-producer-track-notification',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json'
                ),
                body := jsonb_build_object(
                    'track_id', NEW.id,
                    'producer_id', v_producer_id
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_track_upload_notification ON tracks;

-- Create the trigger
CREATE TRIGGER trigger_track_upload_notification
    AFTER INSERT ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION handle_track_upload_notification();

-- Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'tracks'
AND trigger_name = 'trigger_track_upload_notification';

-- Test the function manually with a recent track
SELECT 
    'Testing trigger with recent track' as test_info,
    id as track_id,
    title,
    track_producer_id as producer_id
FROM tracks 
WHERE track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
ORDER BY created_at DESC 
LIMIT 1;
