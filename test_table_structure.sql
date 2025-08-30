-- Test table structure and available fields
-- This will help us understand what fields we can query

-- Show the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'rights_holder_applications'
ORDER BY ordinal_position;

-- Test a simple query to see if basic SELECT works
SELECT 
  id,
  email,
  status,
  company_name
FROM rights_holder_applications 
LIMIT 1;

-- Test the exact query that's failing
SELECT 
  status,
  company_name,
  rights_holder_type,
  business_structure
FROM rights_holder_applications 
WHERE email = 'ilimediagroup3@gmail.com'
LIMIT 1;
