-- Create missing profile for client user
-- Replace '68864336-b612-4b8b-a9ab-050a1f719c7f' with the actual user ID if different

INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  account_type,
  membership_plan,
  age_verified,
  created_at,
  updated_at
) VALUES (
  '68864336-b612-4b8b-a9ab-050a1f719c7f', -- Replace with actual user ID
  'client@example.com', -- Replace with actual email
  'Client', -- Replace with actual first name
  'User', -- Replace with actual last name
  'client',
  'Single Track',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- Check if the profile was created successfully
SELECT * FROM profiles WHERE id = '68864336-b612-4b8b-a9ab-050a1f719c7f';
