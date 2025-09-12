-- Fix function search path for calculate_payment_due_date
-- Set explicit search path to prevent security issues

-- Drop the existing function
DROP FUNCTION IF EXISTS public.calculate_payment_due_date(timestamptz, text);

-- Recreate the function with explicit search path
CREATE OR REPLACE FUNCTION public.calculate_payment_due_date(acceptance_date timestamp with time zone, payment_terms text)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  CASE payment_terms
    WHEN 'net30' THEN
      RETURN acceptance_date + INTERVAL '30 days';
    WHEN 'net60' THEN
      RETURN acceptance_date + INTERVAL '60 days';
    WHEN 'net90' THEN
      RETURN acceptance_date + INTERVAL '90 days';
    ELSE
      RETURN acceptance_date; -- immediate
  END CASE;
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
AND p.proname = 'calculate_payment_due_date'; 