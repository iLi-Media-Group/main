-- Update user 777@777llc.com to be an agent
UPDATE profiles 
SET 
  account_type = 'agent',
  updated_at = NOW()
WHERE email = '777@777llc.com';

-- Verify the change
SELECT 
  id,
  email,
  first_name,
  last_name,
  company_name,
  account_type,
  updated_at
FROM profiles 
WHERE email = '777@777llc.com';
