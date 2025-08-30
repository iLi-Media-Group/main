-- Check the terms acceptance status for babyimmastarrecords@gmail.com
SELECT 
  'Terms Status Check' as info,
  id,
  email,
  account_type,
  verification_status,
  is_active,
  terms_accepted,
  terms_accepted_at,
  rights_authority_declaration_accepted,
  rights_authority_declaration_accepted_at,
  created_at,
  updated_at
FROM profiles
WHERE email = 'babyimmastarrecords@gmail.com';
