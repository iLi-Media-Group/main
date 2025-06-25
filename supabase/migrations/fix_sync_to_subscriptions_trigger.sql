/*
  # Fix sync_to_subscriptions Trigger Function
  
  This migration fixes the sync_to_subscriptions trigger function
  to properly get the user_id from the stripe_customers table.
*/

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS sync_to_subscriptions_trigger ON stripe_subscriptions;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS sync_to_subscriptions();

-- Create the fixed trigger function
CREATE OR REPLACE FUNCTION sync_to_subscriptions()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user_id from stripe_customers table
  SELECT user_id INTO v_user_id
  FROM stripe_customers
  WHERE customer_id = NEW.customer_id
  AND deleted_at IS NULL;
  
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
      NEW.plan_name,
      NEW.status::text,
      CASE WHEN NEW.current_period_start IS NOT NULL 
           THEN to_timestamp(NEW.current_period_start) 
           ELSE NULL END,
      CASE WHEN NEW.current_period_end IS NOT NULL 
           THEN to_timestamp(NEW.current_period_end) 
           ELSE NULL END,
      CASE WHEN NEW.current_period_end IS NOT NULL 
           THEN to_timestamp(NEW.current_period_end) 
           ELSE NULL END,
      CASE WHEN NEW.current_period_start IS NOT NULL 
           THEN to_timestamp(NEW.current_period_start) 
           ELSE NULL END,
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
CREATE TRIGGER sync_to_subscriptions_trigger
  AFTER INSERT OR UPDATE ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_to_subscriptions(); 