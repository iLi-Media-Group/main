-- Re-enable important track triggers (excluding the problematic Algolia trigger)
-- This will restore functionality while keeping the Algolia trigger disabled

-- Re-enable all INSERT triggers on tracks table (except Algolia)
ALTER TABLE tracks ENABLE TRIGGER on_track_insert;
ALTER TABLE tracks ENABLE TRIGGER refresh_sales_analytics_on_track;
ALTER TABLE tracks ENABLE TRIGGER trigger_log_track_upload;
ALTER TABLE tracks ENABLE TRIGGER trigger_sync_track;
ALTER TABLE tracks ENABLE TRIGGER trigger_track_upload_notification;

-- Re-enable UPDATE triggers
ALTER TABLE tracks ENABLE TRIGGER on_track_update;
ALTER TABLE tracks ENABLE TRIGGER update_tracks_deleted_at;

-- Re-enable DELETE triggers
ALTER TABLE tracks ENABLE TRIGGER trigger_notify_track_delete;

-- Verify triggers are enabled
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tracks'
ORDER BY trigger_name;

-- Test that we can still insert tracks with the triggers enabled
-- (The track upload should work now that the Algolia trigger is removed)
