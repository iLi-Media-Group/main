/*
  # Fix Stripe Subscriptions Unique Constraint
  
  This migration adds the missing unique constraint on customer_id
  for the stripe_subscriptions table to support upsert operations.
*/

-- Add unique constraint on customer_id if it doesn't exist
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

-- Also ensure the stripe_customers table has the proper unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stripe_customers_customer_id_key'
  ) THEN
    ALTER TABLE stripe_customers 
    ADD CONSTRAINT stripe_customers_customer_id_key 
    UNIQUE (customer_id);
  END IF;
END $$;

-- Ensure the stripe_orders table has proper constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stripe_orders_checkout_session_id_key'
  ) THEN
    ALTER TABLE stripe_orders 
    ADD CONSTRAINT stripe_orders_checkout_session_id_key 
    UNIQUE (checkout_session_id);
  END IF;
END $$; 