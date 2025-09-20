-- Fix the table name from producer_followers to producer_follows
-- The correct table name is producer_follows, not producer_followers

-- Update the function to use the correct table name
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

-- Now let's check if there are any followers with email notifications enabled
SELECT 
    pf.producer_id,
    pf.follower_id,
    pf.email_notifications_enabled,
    p.first_name as producer_first_name,
    p.last_name as producer_last_name
FROM producer_follows pf
JOIN profiles p ON pf.producer_id = p.id
WHERE pf.email_notifications_enabled = true;

-- Check the debug log to see if the function is being called
SELECT * FROM trigger_debug_log ORDER BY created_at DESC LIMIT 10;
