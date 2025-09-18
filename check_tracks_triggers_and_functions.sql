-- Check for triggers and functions on the tracks table that might be causing the net.http_post error

-- Check for triggers on the tracks table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'tracks'
ORDER BY trigger_name;

-- Check for functions that might be called by triggers
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%net.http_post%'
   OR routine_definition LIKE '%http_post%'
ORDER BY routine_name;

-- Check for any functions that reference 'tracks' table
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%tracks%'
   AND routine_definition LIKE '%INSERT%'
ORDER BY routine_name;

-- Check for any edge functions or webhooks that might be triggered
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%http%'
   OR routine_definition LIKE '%webhook%'
   OR routine_definition LIKE '%edge%'
ORDER BY routine_name;

-- Check if the net extension is installed
SELECT * FROM pg_extension WHERE extname = 'net';

-- Check for any custom functions in the public schema
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND prosrc LIKE '%http%'
ORDER BY proname;
