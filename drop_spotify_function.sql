-- Drop the update_spotify_preview_status function
-- Since we're no longer using Spotify functionality

DROP FUNCTION IF EXISTS public.update_spotify_preview_status();

-- Verify the function was dropped
SELECT 
    p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'update_spotify_preview_status'; 