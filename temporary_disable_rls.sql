-- Temporarily disable RLS for testing
-- This will allow us to test if the query works without RLS restrictions

-- Disable RLS temporarily
ALTER TABLE rights_holder_applications DISABLE ROW LEVEL SECURITY;

-- Test query - this should work now
SELECT 
  id,
  email,
  status,
  company_name,
  'RLS disabled for testing' as note
FROM rights_holder_applications 
WHERE email = 'ilimediagroup3@gmail.com';

-- Show all applications for reference
SELECT 
  id,
  email,
  status,
  company_name
FROM rights_holder_applications 
ORDER BY created_at DESC;

-- Note: Remember to re-enable RLS after testing
-- ALTER TABLE rights_holder_applications ENABLE ROW LEVEL SECURITY;
