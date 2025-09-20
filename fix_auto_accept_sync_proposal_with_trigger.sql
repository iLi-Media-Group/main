-- Fix function search path for auto_accept_sync_proposal
-- Set explicit search path to prevent security issues

-- First, drop the trigger that depends on the function
DROP TRIGGER IF EXISTS trg_auto_accept_sync_proposal ON sync_proposals;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.auto_accept_sync_proposal();

-- Recreate the function with explicit search path
CREATE OR REPLACE FUNCTION public.auto_accept_sync_proposal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.client_status = 'accepted'
     AND NEW.producer_status = 'accepted'
     AND NEW.payment_status = 'paid'
     AND (NEW.status IS DISTINCT FROM 'accepted' OR NEW.negotiation_status IS DISTINCT FROM 'accepted') THEN
    UPDATE sync_proposals
    SET status = 'accepted',
        negotiation_status = 'accepted',
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER trg_auto_accept_sync_proposal
    AFTER UPDATE ON sync_proposals
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_accept_sync_proposal();

-- Verify the function was recreated with proper search path
SELECT 
    p.proname as function_name,
    p.prosecdef as security_definer,
    p.proconfig as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'auto_accept_sync_proposal';

-- Verify the trigger was recreated
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trg_auto_accept_sync_proposal'; 