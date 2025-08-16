-- Temporarily disable track triggers to test if they're causing the issue
-- This will help isolate whether the problem is with the triggers or something else

-- Disable all INSERT triggers on tracks table
ALTER TABLE tracks DISABLE TRIGGER on_track_insert;
ALTER TABLE tracks DISABLE TRIGGER refresh_sales_analytics_on_track;
ALTER TABLE tracks DISABLE TRIGGER trigger_algolia;
ALTER TABLE tracks DISABLE TRIGGER trigger_log_track_upload;
ALTER TABLE tracks DISABLE TRIGGER trigger_sync_track;
ALTER TABLE tracks DISABLE TRIGGER trigger_track_upload_notification;

-- Test if we can now insert a track
-- (You'll need to try uploading a track in your app after running this)

-- To re-enable the triggers later, run:
-- ALTER TABLE tracks ENABLE TRIGGER on_track_insert;
-- ALTER TABLE tracks ENABLE TRIGGER refresh_sales_analytics_on_track;
-- ALTER TABLE tracks ENABLE TRIGGER trigger_algolia;
-- ALTER TABLE tracks ENABLE TRIGGER trigger_log_track_upload;
-- ALTER TABLE tracks ENABLE TRIGGER trigger_sync_track;
-- ALTER TABLE tracks ENABLE TRIGGER trigger_track_upload_notification;
