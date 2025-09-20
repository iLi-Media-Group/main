-- Fix function search path for assign_producer_number
-- Set explicit search path to prevent security issues

-- Drop the existing function
DROP FUNCTION IF EXISTS public.assign_producer_number();

-- Recreate the function with explicit search path
CREATE OR REPLACE FUNCTION public.assign_producer_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.account_type = 'producer' AND NEW.producer_number IS NULL THEN
    NEW.producer_number = generate_producer_number();
  END IF;
  RETURN NEW;
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
AND p.proname = 'assign_producer_number'; 