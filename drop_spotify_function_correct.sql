-- Drop the update_spotify_preview_status function
-- Since we're no longer using Spotify functionality

-- Drop the function with the correct signature
DROP FUNCTION IF EXISTS public.update_spotify_preview_status(uuid, text, text, text, boolean);

-- Verify the function was dropped
SELECT 
    p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'update_spotify_preview_status'; 