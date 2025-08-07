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

-- Check if the net extension is installed and enabled
SELECT * FROM pg_extension WHERE extname = 'net';

-- Check if the net extension is available in the search path
SHOW search_path;

-- Check if we can call net.http_post directly
SELECT net.http_post(
    url := 'https://httpbin.org/post',
    headers := '{"Content-Type": "application/json"}'::json,
    body := '{"test": "data"}'::json
);
