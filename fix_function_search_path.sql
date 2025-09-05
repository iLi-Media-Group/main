-- Fix function search path for update_spotify_preview_status
-- Set explicit search path to prevent security issues

-- First, let's see the current function definition
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'update_spotify_preview_status';

-- Drop the existing function
DROP FUNCTION IF EXISTS public.update_spotify_preview_status();

-- Recreate the function with explicit search path
CREATE OR REPLACE FUNCTION public.update_spotify_preview_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update tracks that have spotify_track_id but no spotify_preview_url
    UPDATE tracks 
    SET use_spotify_preview = false
    WHERE spotify_track_id IS NOT NULL 
    AND spotify_preview_url IS NULL;
    
    -- Update tracks that have spotify_preview_url to use it
    UPDATE tracks 
    SET use_spotify_preview = true
    WHERE spotify_preview_url IS NOT NULL;
END;
$$;

-- Verify the function was recreated with proper search path
SELECT 
    p.proname as function_name,
    p.prosecdef as security_definer,
    p.proconfig as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'update_spotify_preview_status'; 