-- Identify which trigger function is causing the configuration error
-- We'll disable all triggers and then test them one by one

-- First, disable all triggers to get a baseline
ALTER TABLE tracks DISABLE TRIGGER on_track_insert;
ALTER TABLE tracks DISABLE TRIGGER on_track_update;
ALTER TABLE tracks DISABLE TRIGGER refresh_sales_analytics_on_track;
ALTER TABLE tracks DISABLE TRIGGER trigger_log_track_upload;
ALTER TABLE tracks DISABLE TRIGGER trigger_notify_track_delete;
ALTER TABLE tracks DISABLE TRIGGER trigger_sync_track;
ALTER TABLE tracks DISABLE TRIGGER trigger_track_upload_notification;
ALTER TABLE tracks DISABLE TRIGGER update_tracks_deleted_at;

-- Now let's check the function definitions to see which ones might have configuration issues
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name IN (
    'notify_track_change',
    'refresh_sales_analytics',
    'log_track_upload_for_notification',
    'notify_track_delete',
    'call_sync_track',
    'handle_track_upload_notification',
    'update_tracks_updated_at'
)
ORDER BY routine_name;

-- Check if any of these functions reference configuration parameters
-- Look for patterns like 'app.settings' or 'service_role_key' in the function definitions
