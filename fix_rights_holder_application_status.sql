-- Fix Rights Holder Application Status
-- Update applications that are marked as 'invited' to 'onboarded' for approved users

-- First, let's see the current status of applications
SELECT 'Current Application Statuses:' as info;
SELECT email, company_name, status, created_at 
FROM rights_holder_applications 
ORDER BY created_at DESC;

-- Update applications where the user's profile verification_status is 'verified' 
-- but the application status is still 'invited' or 'new'
UPDATE rights_holder_applications 
SET 
  status = 'onboarded',
  updated_at = NOW()
WHERE id IN (
  SELECT rha.id 
  FROM rights_holder_applications rha
  INNER JOIN profiles p ON p.email = rha.email
  WHERE p.verification_status = 'verified' 
  AND rha.status IN ('invited', 'new')
);

-- Show the updated statuses
SELECT 'Updated Application Statuses:' as info;
SELECT email, company_name, status, created_at, updated_at
FROM rights_holder_applications 
ORDER BY created_at DESC;

-- Also check if there are any profiles with verified status but applications not updated
SELECT 'Profiles with verified status:' as info;
SELECT p.email, p.verification_status, rha.status as application_status
FROM profiles p
LEFT JOIN rights_holder_applications rha ON p.email = rha.email
WHERE p.account_type = 'rights_holder' 
AND p.verification_status = 'verified'
ORDER BY p.updated_at DESC;
