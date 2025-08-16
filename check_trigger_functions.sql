-- Check trigger functions that might be causing the configuration error
-- The error is likely coming from one of these functions

-- 1. Check notify_track_change function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'notify_track_change';

-- 2. Check refresh_sales_analytics function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'refresh_sales_analytics';

-- 3. Check notify_algolia function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'notify_algolia';

-- 4. Check log_track_upload_for_notification function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'log_track_upload_for_notification';

-- 5. Check call_sync_track function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'call_sync_track';

-- 6. Check handle_track_upload_notification function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_track_upload_notification';

-- 7. Check update_tracks_updated_at function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_tracks_updated_at';
