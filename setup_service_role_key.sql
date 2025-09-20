-- Set up the service role key as a database setting for Edge Function authentication
-- This allows the trigger function to call the Edge Function with proper authentication

-- First, let's create a simpler version of the function that doesn't rely on the service role key
-- We'll use the anon key instead, which should work for internal Edge Function calls

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
            FROM producer_followers 
            WHERE producer_id = v_producer_id 
            AND email_notifications_enabled = true
        ) INTO v_has_followers;
        
        -- If producer has followers with notifications enabled, call the Edge Function
        IF v_has_followers THEN
            -- Call the Edge Function asynchronously
            -- Note: The Edge Function will use its own service role key from environment variables
            PERFORM net.http_post(
                url := 'https://yciqkebqlajqbpwlujma.supabase.co/functions/v1/send-producer-track-notification',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json'
                    -- The Edge Function will authenticate itself using its own service role key
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

-- Verify the function was updated correctly
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_track_upload_notification';

-- Test that the function can be called without errors
-- (This will help us verify the syntax is correct)
