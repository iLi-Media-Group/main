-- Approve Test Rights Holder Account
-- This script approves the test account for immediate testing

-- ============================================
-- 1. APPROVE THE TEST ACCOUNT
-- ============================================

UPDATE rights_holders 
SET 
  verification_status = 'verified',
  verification_notes = 'Approved for testing purposes - production verification workflow',
  updated_at = NOW()
WHERE id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc';

-- ============================================
-- 2. VERIFY THE UPDATE
-- ============================================

SELECT 
  'Test account updated' as status,
  id,
  email,
  company_name,
  verification_status,
  verification_notes,
  updated_at
FROM rights_holders
WHERE id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc';

-- ============================================
-- 3. CHECK FOR NOTIFICATIONS
-- ============================================

SELECT 
  'Verification notifications' as status,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_notifications,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_notifications
FROM verification_notifications
WHERE rights_holder_id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc';

-- ============================================
-- 4. NEXT STEPS
-- ============================================

SELECT 
  'Next steps' as status,
  '1. Sign out of the rights holder account' as step1,
  '2. Sign back in - you should now go to dashboard' as step2,
  '3. Access admin panel at /admin/rights-verification' as step3,
  '4. Test the verification workflow with new accounts' as step4;
