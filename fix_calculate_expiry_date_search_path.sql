-- Fix function search path for calculate_expiry_date
-- Set explicit search path to prevent security issues

-- Drop the existing function
DROP FUNCTION IF EXISTS public.calculate_expiry_date();

-- Recreate the function with explicit search path
CREATE OR REPLACE FUNCTION public.calculate_expiry_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_membership_plan text;
BEGIN
  -- Get the user's membership plan
  SELECT membership_plan INTO v_membership_plan
  FROM profiles
  WHERE id = NEW.buyer_id;
  
  -- Set expiry date based on membership plan
  IF v_membership_plan = 'Ultimate Access' THEN
    -- Set to 100 years in the future (effectively perpetual)
    NEW.expiry_date := (NOW() + INTERVAL '100 years')::timestamp;
  ELSIF v_membership_plan = 'Platinum Access' THEN
    -- 3 years
    NEW.expiry_date := (NOW() + INTERVAL '3 years')::timestamp;
  ELSE
    -- Default to 1 year for Gold Access and Single Track
    NEW.expiry_date := (NOW() + INTERVAL '1 year')::timestamp;
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
AND p.proname = 'calculate_expiry_date'; 