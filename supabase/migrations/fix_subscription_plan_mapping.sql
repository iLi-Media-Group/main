/*
  # Fix Subscription Plan Mapping and Date Handling
  
  This migration fixes the trigger function to properly map Stripe price IDs
  to plan names and handle subscription dates correctly.
*/

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_sync_to_subscriptions ON stripe_subscriptions;
DROP FUNCTION IF EXISTS sync_to_subscriptions() CASCADE;

-- Create the fixed trigger function with proper plan mapping
CREATE OR REPLACE FUNCTION sync_to_subscriptions()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_mapped_status text;
  v_plan_name text;
  v_start_date timestamp with time zone;
  v_end_date timestamp with time zone;
BEGIN
  -- Get the user_id from stripe_customers table
  SELECT user_id INTO v_user_id
  FROM stripe_customers
  WHERE customer_id = NEW.customer_id
  AND deleted_at IS NULL;
  
  -- Map Stripe status to subscription status
  CASE NEW.status::text
    WHEN 'not_started', 'incomplete', 'incomplete_expired' THEN
      v_mapped_status := 'pending';
    WHEN 'trialing', 'active' THEN
      v_mapped_status := 'active';
    WHEN 'past_due', 'unpaid' THEN
      v_mapped_status := 'pending';
    WHEN 'canceled', 'paused' THEN
      v_mapped_status := 'cancelled';
    ELSE
      v_mapped_status := 'pending';
  END CASE;
  
  -- Map price_id to plan name
  CASE NEW.price_id
    WHEN 'price_1RdAfqR8RYA8TFzwKP7zrKsm' THEN
      v_plan_name := 'Ultimate Access';
    WHEN 'price_1RdAfXR8RYA8TFzwFZyaSREP' THEN
      v_plan_name := 'Platinum Access';
    WHEN 'price_1RdAfER8RYA8TFzw7RrrNmtt' THEN
      v_plan_name := 'Gold Access';
    WHEN 'price_1RdAeZR8RYA8TFzwVH3MHECa' THEN
      v_plan_name := 'Single Track';
    ELSE
      v_plan_name := COALESCE(NEW.plan_name, 'Unknown');
  END CASE;
  
  -- Handle dates properly
  IF NEW.current_period_start IS NOT NULL AND NEW.current_period_start > 0 THEN
    v_start_date := to_timestamp(NEW.current_period_start);
  ELSE
    v_start_date := NOW();
  END IF;
  
  IF NEW.current_period_end IS NOT NULL AND NEW.current_period_end > 0 THEN
    v_end_date := to_timestamp(NEW.current_period_end);
  ELSE
    -- Set end date based on plan type
    CASE v_plan_name
      WHEN 'Ultimate Access' THEN
        v_end_date := v_start_date + INTERVAL '100 years'; -- Effectively unlimited
      WHEN 'Platinum Access' THEN
        v_end_date := v_start_date + INTERVAL '3 years';
      WHEN 'Gold Access' THEN
        v_end_date := v_start_date + INTERVAL '1 year';
      WHEN 'Single Track' THEN
        v_end_date := v_start_date + INTERVAL '1 year';
      ELSE
        v_end_date := v_start_date + INTERVAL '1 year';
    END CASE;
  END IF;
  
  -- Only proceed if we found a user_id
  IF v_user_id IS NOT NULL THEN
    INSERT INTO subscriptions (
      user_id,
      payment_method,
      membership_tier,
      status,
      start_date,
      end_date,
      next_billing_date,
      last_payment_date,
      stripe_subscription_id,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      COALESCE(NEW.payment_method_brand, 'stripe'),
      v_plan_name,
      v_mapped_status,
      v_start_date,
      v_end_date,
      v_end_date, -- next_billing_date same as end_date for now
      v_start_date, -- last_payment_date same as start_date
      NEW.subscription_id,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      payment_method = EXCLUDED.payment_method,
      membership_tier = EXCLUDED.membership_tier,
      status = EXCLUDED.status,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      next_billing_date = EXCLUDED.next_billing_date,
      last_payment_date = EXCLUDED.last_payment_date,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_sync_to_subscriptions
  AFTER INSERT OR UPDATE ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_to_subscriptions(); 