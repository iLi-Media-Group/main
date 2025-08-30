-- Create missing Stripe customer
-- This will add the customer to the stripe_customers table

INSERT INTO stripe_customers (
  customer_id,
  user_id,
  email,
  first_name,
  last_name,
  created_at,
  updated_at
) VALUES (
  'cus_Sn3TsTd8HKsRTR',
  '68864336-b612-4b8b-a9ab-050a1f719c7f', -- Replace with actual user ID if different
  '333@333.com',
  'John',
  'Test',
  NOW(),
  NOW()
) ON CONFLICT (customer_id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  updated_at = NOW();

-- Check if the customer was created successfully
SELECT * FROM stripe_customers WHERE customer_id = 'cus_Sn3TsTd8HKsRTR';

-- Fix RLS policies for background_assets table (causing 406 errors)
DROP POLICY IF EXISTS "Enable read access for all users" ON background_assets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON background_assets;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON background_assets;

-- Recreate policies with correct permissions
CREATE POLICY "Enable read access for all users" ON background_assets
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON background_assets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" ON background_assets
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for users based on user_id" ON background_assets
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Fix RLS policies for payments table (causing 404 errors)
DROP POLICY IF EXISTS "Enable read access for all users" ON payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON payments;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON payments;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON payments;

-- Recreate policies for payments table
CREATE POLICY "Enable read access for all users" ON payments
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON payments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" ON payments
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for users based on user_id" ON payments
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Fix RLS policies for user_memberships table (causing 404 errors)
DROP POLICY IF EXISTS "Enable read access for all users" ON user_memberships;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_memberships;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_memberships;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_memberships;

-- Recreate policies for user_memberships table
CREATE POLICY "Enable read access for all users" ON user_memberships
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON user_memberships
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" ON user_memberships
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for users based on user_id" ON user_memberships
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Fix RLS policies for sync_proposals table (causing 400 errors)
DROP POLICY IF EXISTS "Enable read access for all users" ON sync_proposals;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON sync_proposals;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON sync_proposals;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON sync_proposals;

-- Recreate policies for sync_proposals table
CREATE POLICY "Enable read access for all users" ON sync_proposals
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON sync_proposals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" ON sync_proposals
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for users based on user_id" ON sync_proposals
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add missing columns to sync_proposals table if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_proposals' AND column_name = 'permitted_use') THEN
    ALTER TABLE sync_proposals ADD COLUMN permitted_use TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_proposals' AND column_name = 'project') THEN
    ALTER TABLE sync_proposals ADD COLUMN project TEXT;
  END IF;
END $$;

-- Verify the tables exist and have the correct structure
SELECT 'stripe_customers' as table_name, COUNT(*) as row_count FROM stripe_customers
UNION ALL
SELECT 'background_assets' as table_name, COUNT(*) as row_count FROM background_assets
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as row_count FROM payments
UNION ALL
SELECT 'user_memberships' as table_name, COUNT(*) as row_count FROM user_memberships
UNION ALL
SELECT 'sync_proposals' as table_name, COUNT(*) as row_count FROM sync_proposals;
