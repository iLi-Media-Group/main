-- Temporarily Disable Notification Trigger
-- This will allow track uploads to work while we fix the notification system

-- First, let's see what triggers exist
SELECT 'Current triggers on tracks table:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'tracks'
ORDER BY trigger_name;

-- Disable the notification trigger (if it exists)
-- This will allow track uploads to work without the failing notification
ALTER TABLE tracks DISABLE TRIGGER IF EXISTS handle_track_upload_notification;

-- Verify the trigger is disabled
SELECT 'Trigger status after disabling:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'tracks'
ORDER BY trigger_name;
