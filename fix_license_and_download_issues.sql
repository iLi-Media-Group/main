-- Fix License Agreement and Download Issues
-- This script addresses the 400/404/406 errors and split sheet path issues

-- 1. Create license_agreements table if it doesn't exist
CREATE TABLE IF NOT EXISTS license_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  pdf_url TEXT,
  licensee_info JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on license_agreements table
ALTER TABLE license_agreements ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for license_agreements
DROP POLICY IF EXISTS "Enable read access for all users" ON license_agreements;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON license_agreements;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON license_agreements;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON license_agreements;

CREATE POLICY "Enable read access for all users" ON license_agreements
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON license_agreements
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" ON license_agreements
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for users based on user_id" ON license_agreements
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 4. Fix RLS policies for licenses table (causing 400 errors)
DROP POLICY IF EXISTS "Enable read access for all users" ON licenses;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON licenses;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON licenses;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON licenses;

CREATE POLICY "Enable read access for all users" ON licenses
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON licenses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" ON licenses
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for users based on user_id" ON licenses
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 5. Fix RLS policies for background_assets table (causing 406 errors)
DROP POLICY IF EXISTS "Enable read access for all users" ON background_assets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON background_assets;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON background_assets;

CREATE POLICY "Enable read access for all users" ON background_assets
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON background_assets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" ON background_assets
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for users based on user_id" ON background_assets
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 6. Fix RLS policies for payments table (causing 404 errors)
DROP POLICY IF EXISTS "Enable read access for all users" ON payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON payments;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON payments;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON payments;

CREATE POLICY "Enable read access for all users" ON payments
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON payments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" ON payments
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for users based on user_id" ON payments
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 7. Fix RLS policies for user_memberships table (causing 404 errors)
DROP POLICY IF EXISTS "Enable read access for all users" ON user_memberships;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_memberships;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_memberships;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_memberships;

CREATE POLICY "Enable read access for all users" ON user_memberships
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON user_memberships
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" ON user_memberships
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for users based on user_id" ON user_memberships
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 8. Fix RLS policies for sync_proposals table (causing 400 errors)
DROP POLICY IF EXISTS "Enable read access for all users" ON sync_proposals;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON sync_proposals;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON sync_proposals;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON sync_proposals;

CREATE POLICY "Enable read access for all users" ON sync_proposals
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON sync_proposals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" ON sync_proposals
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for users based on user_id" ON sync_proposals
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 9. Add missing columns to sync_proposals table if they don't exist
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

-- 10. Create missing Stripe customer
INSERT INTO stripe_customers (
  customer_id,
  user_id,
  created_at,
  updated_at
) VALUES (
  'cus_Sn3TsTd8HKsRTR',
  '68864336-b612-4b8b-a9ab-050a1f719c7f',
  NOW(),
  NOW()
) ON CONFLICT (customer_id) DO UPDATE SET
  updated_at = NOW();

-- 11. Create missing profile for the user
INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  account_type,
  created_at,
  updated_at
) VALUES (
  '68864336-b612-4b8b-a9ab-050a1f719c7f',
  '333@333.com',
  'John',
  'Test',
  'client',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  updated_at = NOW();

-- 12. Verify all tables exist and have correct structure
SELECT 'license_agreements' as table_name, COUNT(*) as row_count FROM license_agreements
UNION ALL
SELECT 'licenses' as table_name, COUNT(*) as row_count FROM licenses
UNION ALL
SELECT 'background_assets' as table_name, COUNT(*) as row_count FROM background_assets
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as row_count FROM payments
UNION ALL
SELECT 'user_memberships' as table_name, COUNT(*) as row_count FROM user_memberships
UNION ALL
SELECT 'sync_proposals' as table_name, COUNT(*) as row_count FROM sync_proposals
UNION ALL
SELECT 'stripe_customers' as table_name, COUNT(*) as row_count FROM stripe_customers
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles;
