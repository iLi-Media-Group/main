-- Remove Algolia trigger and function that's causing the configuration error
-- This should resolve the "unrecognized configuration parameter" issue

-- 1. Drop the Algolia trigger from tracks table
DROP TRIGGER IF EXISTS trigger_algolia ON tracks;

-- 2. Drop the notify_algolia function
DROP FUNCTION IF EXISTS notify_algolia();

-- 3. Verify the trigger is gone
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tracks' 
AND trigger_name = 'trigger_algolia';

-- 4. Verify the function is gone
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'notify_algolia';

-- 5. Show remaining triggers on tracks table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tracks'
ORDER BY trigger_name;
