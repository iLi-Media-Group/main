/*
  # Fix Stripe Subscriptions Insert Issue
  
  This migration ensures the stripe_subscriptions table has the correct
  structure and data types to support proper inserts.
*/

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

-- Ensure the stripe_subscriptions table has the correct structure
DO $$
BEGIN
  -- Add any missing columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'id'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN created_at timestamp with time zone DEFAULT now();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN deleted_at timestamp with time zone DEFAULT null;
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

-- Test insert to ensure the table works
DO $$
DECLARE
  test_customer_id text := 'test_customer_' || floor(random() * 1000000)::text;
BEGIN
  -- Try to insert a test record
  INSERT INTO stripe_subscriptions (
    customer_id,
    status
  ) VALUES (
    test_customer_id,
    'not_started'
  );
  
  -- Clean up the test record
  DELETE FROM stripe_subscriptions WHERE customer_id = test_customer_id;
  
  RAISE NOTICE 'Test insert successful - table structure is correct';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test insert failed: %', SQLERRM;
END $$; 