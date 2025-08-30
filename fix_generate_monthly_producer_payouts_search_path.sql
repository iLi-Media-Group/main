-- Fix function search path for generate_monthly_producer_payouts
-- Set explicit search path to prevent security issues

-- Drop the existing function
DROP FUNCTION IF EXISTS public.generate_monthly_producer_payouts(text, boolean);

-- Recreate the function with explicit search path
CREATE OR REPLACE FUNCTION public.generate_monthly_producer_payouts(p_month text, p_force_regenerate boolean DEFAULT false)
RETURNS TABLE(producer_id uuid, amount_usdc numeric, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_producer record;
  v_earnings numeric;
  v_payout_id uuid;
BEGIN
  -- Check if month format is valid
  IF p_month !~ '^\d{4}-\d{2}$' THEN
    RAISE EXCEPTION 'Invalid month format. Use YYYY-MM';
  END IF;
  
  -- Delete existing payouts if force regenerate is true
  IF p_force_regenerate THEN
    DELETE FROM producer_payouts WHERE month = p_month;
  END IF;
  
  -- Loop through all producers
  FOR v_producer IN 
    SELECT id, usdc_address FROM profiles WHERE account_type = 'producer'
  LOOP
    -- Calculate earnings
    v_earnings := get_producer_monthly_earnings(v_producer.id, p_month);
    
    -- Determine status
    IF v_earnings <= 0 OR v_producer.usdc_address IS NULL THEN
      -- Skip if no earnings or no USDC address
      INSERT INTO producer_payouts (
        producer_id, 
        amount_usdc, 
        month, 
        status
      ) VALUES (
        v_producer.id,
        v_earnings,
        p_month,
        'skipped'
      ) RETURNING id INTO v_payout_id;
      
      producer_id := v_producer.id;
      amount_usdc := v_earnings;
      status := 'skipped';
      RETURN NEXT;
    ELSE
      -- Create pending payout
      INSERT INTO producer_payouts (
        producer_id, 
        amount_usdc, 
        month, 
        status,
        payment_method
      ) VALUES (
        v_producer.id,
        v_earnings,
        p_month,
        'pending',
        'usdc_solana'
      ) RETURNING id INTO v_payout_id;
      
      producer_id := v_producer.id;
      amount_usdc := v_earnings;
      status := 'pending';
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
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
AND p.proname = 'generate_monthly_producer_payouts'; 