-- Check Triggers on Tracks Table
-- This will show us exactly what triggers are firing

SELECT 'Triggers on tracks table:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tracks'
ORDER BY trigger_name;

-- Check if the notification trigger is enabled
SELECT 'Notification trigger details:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tracks' 
  AND trigger_name LIKE '%notification%'
ORDER BY trigger_name;
