-- Fix Duplicate RLS Policies for Rights Holder Applications
-- Remove duplicate policies that might be causing conflicts

-- 1. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow public inserts for rights holder applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable insert access for public" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable read access for admins" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable update access for admins" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable service role access" ON rights_holder_applications;

-- 2. Create clean, single policies
-- Public insert policy (for applications)
CREATE POLICY "Enable insert access for public" ON rights_holder_applications
  FOR INSERT WITH CHECK (true);

-- Admin read policy
CREATE POLICY "Enable read access for admins" ON rights_holder_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.account_type = 'admin' OR 
        profiles.account_type = 'admin,producer' OR
        profiles.account_type LIKE '%admin%'
      )
    )
  );

-- Admin update policy
CREATE POLICY "Enable update access for admins" ON rights_holder_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.account_type = 'admin' OR 
        profiles.account_type = 'admin,producer' OR
        profiles.account_type LIKE '%admin%'
      )
    )
  );

-- Service role policy (for admin dashboard)
CREATE POLICY "Enable service role access" ON rights_holder_applications
  FOR ALL USING (auth.role() = 'service_role');

-- 3. Show the cleaned up policies
SELECT 'Cleaned up RLS policies:' as info;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'rights_holder_applications'
ORDER BY policyname;

-- 4. Test insert with clean policies
SELECT 'Testing insert with clean policies...' as info;
INSERT INTO rights_holder_applications (
  company_name,
  contact_first_name,
  contact_last_name,
  email,
  phone,
  rights_holder_type,
  website,
  company_size,
  years_in_business,
  primary_genres,
  catalog_size,
  has_sync_experience,
  sync_experience_details,
  has_licensing_team,
  licensing_team_size,
  revenue_range,
  target_markets,
  additional_info,
  status,
  auto_disqualified,
  application_score,
  manual_review,
  manual_review_approved
) VALUES (
  'Test Company Clean',
  'Test',
  'Contact',
  'testclean@example.com',
  '555-123-4567',
  'record_label',
  'https://test.com',
  'Small',
  5,
  ARRAY['Pop', 'Rock'],
  100,
  true,
  'Some experience',
  true,
  3,
  '100k-500k',
  ARRAY['US', 'UK'],
  'Test additional info',
  'new',
  false,
  0,
  false,
  false
);

-- 5. Verify the test insert worked
SELECT 'Test insert result:' as info;
SELECT 
  id, 
  company_name, 
  email, 
  rights_holder_type, 
  status, 
  created_at 
FROM rights_holder_applications 
WHERE company_name = 'Test Company Clean';

-- 6. Clean up test data
DELETE FROM rights_holder_applications WHERE company_name = 'Test Company Clean';
