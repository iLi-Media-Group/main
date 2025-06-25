/*
  # Fix Stripe Subscriptions with View Dependencies
  
  This migration properly handles view dependencies when fixing
  the stripe_subscriptions table structure.
*/

-- Drop the views that depend on the stripe_subscriptions table
DROP VIEW IF EXISTS stripe_user_subscriptions;
DROP VIEW IF EXISTS stripe_user_orders;

-- First, let's check and fix the stripe_subscription_status enum
DO $$
BEGIN
  -- Drop the enum if it exists and recreate it to ensure all values are present
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stripe_subscription_status') THEN
    -- Create a temporary enum with all values
    CREATE TYPE stripe_subscription_status_new AS ENUM (
        'not_started',
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused'
    );
    
    -- Update the column to use the new enum
    ALTER TABLE stripe_subscriptions 
    ALTER COLUMN status TYPE stripe_subscription_status_new 
    USING status::text::stripe_subscription_status_new;
    
    -- Drop the old enum and rename the new one
    DROP TYPE stripe_subscription_status;
    ALTER TYPE stripe_subscription_status_new RENAME TO stripe_subscription_status;
  ELSE
    -- Create the enum if it doesn't exist
    CREATE TYPE stripe_subscription_status AS ENUM (
        'not_started',
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused'
    );
  END IF;
END $$;

-- Ensure the unique constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stripe_subscriptions_customer_id_key'
  ) THEN
    ALTER TABLE stripe_subscriptions 
    ADD CONSTRAINT stripe_subscriptions_customer_id_key 
    UNIQUE (customer_id);
  END IF;
END $$;

-- Recreate the views
CREATE OR REPLACE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.payment_method_brand,
    s.payment_method_last4
FROM stripe_customers c
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND (s.deleted_at IS NULL OR s.deleted_at IS NULL);

GRANT SELECT ON stripe_user_subscriptions TO authenticated;

CREATE OR REPLACE VIEW stripe_user_orders WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    o.id as order_id,
    o.checkout_session_id,
    o.payment_intent_id,
    o.amount_subtotal,
    o.amount_total,
    o.currency,
    o.payment_status,
    o.status as order_status,
    o.created_at as order_date
FROM stripe_customers c
LEFT JOIN stripe_orders o ON c.customer_id = o.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND (o.deleted_at IS NULL OR o.deleted_at IS NULL);

GRANT SELECT ON stripe_user_orders TO authenticated; 