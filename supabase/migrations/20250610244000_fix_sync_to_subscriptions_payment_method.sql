-- Fix the sync_to_subscriptions function to properly map payment methods
-- The current function is trying to insert 'visa' into payment_method, but the check constraint doesn't allow it

-- Drop the existing trigger
DROP TRIGGER IF EXISTS sync_to_subscriptions_trigger ON stripe_subscriptions;

-- Drop the existing function
DROP FUNCTION IF EXISTS sync_to_subscriptions();

-- Create the fixed trigger function with proper payment method mapping
CREATE OR REPLACE FUNCTION sync_to_subscriptions()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_payment_method text;
BEGIN
  -- Get the user_id from stripe_customers table
  SELECT user_id INTO v_user_id
  FROM stripe_customers
  WHERE customer_id = NEW.customer_id
  AND deleted_at IS NULL;
  
  -- Map payment method brand to allowed values
  v_payment_method := CASE 
    WHEN NEW.payment_method_brand IS NULL THEN 'stripe'
    WHEN NEW.payment_method_brand IN ('visa', 'mastercard', 'amex', 'discover', 'jcb', 'diners_club', 'unionpay') THEN 'card'
    ELSE 'stripe'
  END;
  
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
      v_payment_method,
      COALESCE(NEW.plan_name, 'Unknown'),
      COALESCE(NEW.status::text, 'active'),
      CASE WHEN NEW.current_period_start IS NOT NULL 
           THEN to_timestamp(NEW.current_period_start) 
           ELSE NOW() END,
      CASE WHEN NEW.current_period_end IS NOT NULL 
           THEN to_timestamp(NEW.current_period_end) 
           ELSE NULL END,
      CASE WHEN NEW.current_period_end IS NOT NULL 
           THEN to_timestamp(NEW.current_period_end) 
           ELSE NULL END,
      CASE WHEN NEW.current_period_start IS NOT NULL 
           THEN to_timestamp(NEW.current_period_start) 
           ELSE NOW() END,
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