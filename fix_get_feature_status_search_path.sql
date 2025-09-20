-- Fix function search path for get_feature_status
-- Set explicit search path to prevent security issues

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_feature_status(text);

-- Recreate the function with explicit search path
CREATE OR REPLACE FUNCTION public.get_feature_status(feature_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  is_enabled BOOLEAN;
BEGIN
  -- Check if user has specific feature enabled
  SELECT wlf.is_enabled INTO is_enabled
  FROM white_label_features wlf
  WHERE wlf.client_id = auth.uid() 
    AND wlf.feature_name = get_feature_status.feature_name;
  
  -- If no specific setting found, check global default
  IF is_enabled IS NULL THEN
    SELECT wlf.is_enabled INTO is_enabled
    FROM white_label_features wlf
    WHERE wlf.client_id IS NULL 
      AND wlf.feature_name = get_feature_status.feature_name;
  END IF;
  
  RETURN COALESCE(is_enabled, false);
END;
$function$;

-- Verify the function was recreated with proper search path
SELECT 
    p.proname as function_name,
    p.prosecdef as security_definer,
    p.proconfig as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'get_feature_status'; 