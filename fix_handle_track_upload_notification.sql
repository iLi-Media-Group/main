-- Fix the handle_track_upload_notification function by removing the problematic configuration parameter
-- The function is trying to access 'app.settings.service_role_key' which doesn't exist

-- Drop the existing function
DROP FUNCTION IF EXISTS handle_track_upload_notification();

-- Create the fixed function without the problematic configuration parameter
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
        
        -- If producer has followers with notifications enabled, call the Edge Function
        IF v_has_followers THEN
            -- Call the Edge Function asynchronously (without the problematic authorization header)
            PERFORM net.http_post(
                url := 'https://yciqkebqlajqbpwlujma.supabase.co/functions/v1/send-producer-track-notification',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json'
                    -- Removed the Authorization header that was causing the configuration error
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

-- Re-enable the trigger
ALTER TABLE tracks ENABLE TRIGGER trigger_track_upload_notification;

-- Verify the function was created correctly
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_track_upload_notification';
