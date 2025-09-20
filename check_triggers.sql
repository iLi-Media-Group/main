-- Check Database Triggers
-- This will show us what triggers exist on the tracks table

SELECT 'Triggers on tracks table:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tracks'
ORDER BY trigger_name;

-- Check for any functions that might be called by triggers
SELECT 'Functions that might be called by triggers:' as info;
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%track%' 
  OR routine_name LIKE '%notification%'
  OR routine_name LIKE '%producer%'
ORDER BY routine_name;
