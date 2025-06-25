/*
  # Fix Subscriptions Table Constraint
  
  This migration adds the missing unique constraint on user_id
  for the subscriptions table that the sync_to_subscriptions trigger needs.
*/

-- Add unique constraint on user_id for subscriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_user_id_key'
  ) THEN
    ALTER TABLE subscriptions 
    ADD CONSTRAINT subscriptions_user_id_key 
    UNIQUE (user_id);
  END IF;
END $$;

-- Also ensure the subscriptions table has the correct structure
DO $$
BEGIN
  -- Add any missing columns that the trigger function expects
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN payment_method text DEFAULT 'stripe';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'membership_tier'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN membership_tier text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'status'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN status text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN start_date timestamp with time zone;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN end_date timestamp with time zone;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'next_billing_date'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN next_billing_date timestamp with time zone;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'last_payment_date'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN last_payment_date timestamp with time zone;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN created_at timestamp with time zone DEFAULT now();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$; 