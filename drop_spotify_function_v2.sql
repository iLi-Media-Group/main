-- Drop the update_spotify_preview_status function
-- Since we're no longer using Spotify functionality

-- First, let's see the exact function signature
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'update_spotify_preview_status';

-- Drop the function with the correct signature
DROP FUNCTION IF EXISTS public.update_spotify_preview_status();

-- Also try dropping with explicit void return type
DROP FUNCTION IF EXISTS public.update_spotify_preview_status(void);

-- Verify the function was dropped
SELECT 
    p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'update_spotify_preview_status'; 