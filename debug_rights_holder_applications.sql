-- Debug Rights Holder Applications
-- Run this in Supabase SQL Editor to check the current state

-- 1. Check if table exists and its structure
SELECT 'Table exists check:' as info;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'rights_holder_applications'
) as table_exists;

-- 2. Show table structure
SELECT 'Table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'rights_holder_applications' 
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 'RLS status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'rights_holder_applications';

-- 4. List all RLS policies
SELECT 'RLS policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'rights_holder_applications';

-- 5. Check if there are any existing records
SELECT 'Record count:' as info;
SELECT COUNT(*) as total_records FROM rights_holder_applications;

-- 6. Show all existing records (if any)
SELECT 'All records:' as info;
SELECT 
  id, 
  company_name, 
  email, 
  rights_holder_type, 
  status, 
  created_at 
FROM rights_holder_applications 
ORDER BY created_at DESC;

-- 7. Test insert permissions (this will show if RLS is blocking inserts)
SELECT 'Testing insert permissions...' as info;
-- Note: This will fail if RLS is blocking, but that's what we want to see
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
  'Test Company',
  'Test',
  'Contact',
  'test@example.com',
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

-- 8. Check if the test insert worked
SELECT 'After test insert - Record count:' as info;
SELECT COUNT(*) as total_records FROM rights_holder_applications;

-- 9. Show the test record
SELECT 'Test record:' as info;
SELECT 
  id, 
  company_name, 
  email, 
  rights_holder_type, 
  status, 
  created_at 
FROM rights_holder_applications 
WHERE company_name = 'Test Company'
ORDER BY created_at DESC;

-- 10. Clean up test data
DELETE FROM rights_holder_applications WHERE company_name = 'Test Company';

-- 11. Check admin user permissions
SELECT 'Admin user check:' as info;
SELECT 
  id,
  email,
  account_type,
  verification_status
FROM profiles 
WHERE account_type LIKE '%admin%'
ORDER BY created_at DESC;
