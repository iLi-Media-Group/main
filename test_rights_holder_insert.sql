-- Test Rights Holder Applications Insert
-- This will help us determine if the issue is with RLS policies or data structure

-- 1. First, let's disable RLS temporarily to test if the table structure is correct
ALTER TABLE rights_holder_applications DISABLE ROW LEVEL SECURITY;

-- 2. Try to insert a test record
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
  'Test Company 2',
  'Test',
  'Contact',
  'test2@example.com',
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

-- 3. Check if the insert worked
SELECT 'Test insert result:' as info;
SELECT 
  id, 
  company_name, 
  email, 
  rights_holder_type, 
  status, 
  created_at 
FROM rights_holder_applications 
WHERE company_name = 'Test Company 2';

-- 4. Re-enable RLS
ALTER TABLE rights_holder_applications ENABLE ROW LEVEL SECURITY;

-- 5. Check if we can still read the record with RLS enabled
SELECT 'Can read with RLS enabled:' as info;
SELECT 
  id, 
  company_name, 
  email, 
  rights_holder_type, 
  status, 
  created_at 
FROM rights_holder_applications 
WHERE company_name = 'Test Company 2';

-- 6. Clean up test data
DELETE FROM rights_holder_applications WHERE company_name = 'Test Company 2';

-- 7. Show current RLS policies
SELECT 'Current RLS policies:' as info;
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
