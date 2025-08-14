-- Create trigger to automatically send notifications when a track is uploaded
-- This trigger will call the Edge Function to notify followers

-- Function to handle track upload notifications
CREATE OR REPLACE FUNCTION handle_track_upload_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
            -- Call the Edge Function asynchronously
            PERFORM net.http_post(
                url := 'https://your-project-ref.supabase.co/functions/v1/send-producer-track-notification',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
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
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_track_upload_notification ON tracks;
CREATE TRIGGER trigger_track_upload_notification
    AFTER INSERT ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION handle_track_upload_notification();

-- Alternative approach: Create a simpler trigger that just logs the event
-- This can be used if the http extension is not available
CREATE OR REPLACE FUNCTION log_track_upload_for_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only trigger for new tracks (not updates)
    IF TG_OP = 'INSERT' THEN
        -- Insert into a notification queue table
        INSERT INTO track_notification_queue (track_id, producer_id, created_at)
        VALUES (NEW.id, NEW.track_producer_id, NOW());
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create notification queue table
CREATE TABLE IF NOT EXISTS track_notification_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    producer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for the queue
CREATE INDEX IF NOT EXISTS idx_track_notification_queue_processed ON track_notification_queue(processed);
CREATE INDEX IF NOT EXISTS idx_track_notification_queue_created_at ON track_notification_queue(created_at);

-- Enable RLS on the queue table
ALTER TABLE track_notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for the queue table (only service role can access)
CREATE POLICY "Service role can manage notification queue" ON track_notification_queue
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON track_notification_queue TO authenticated;

-- Create the simpler trigger
DROP TRIGGER IF EXISTS trigger_log_track_upload ON tracks;
CREATE TRIGGER trigger_log_track_upload
    AFTER INSERT ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION log_track_upload_for_notification();

-- Function to process the notification queue
CREATE OR REPLACE FUNCTION process_track_notification_queue()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_queue_item RECORD;
    v_processed_count INTEGER := 0;
BEGIN
    -- Process unprocessed items in the queue
    FOR v_queue_item IN 
        SELECT id, track_id, producer_id
        FROM track_notification_queue
        WHERE processed = false
        ORDER BY created_at ASC
        LIMIT 10
    LOOP
        -- Mark as processed
        UPDATE track_notification_queue
        SET processed = true, processed_at = NOW()
        WHERE id = v_queue_item.id;
        
        v_processed_count := v_processed_count + 1;
    END LOOP;
    
    RETURN v_processed_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_track_notification_queue() TO authenticated;

SELECT 'Track notification triggers created successfully' as status;
