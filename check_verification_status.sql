-- Check and Fix Rights Holder Verification Status
-- This script checks the current status and provides options to update it

-- ============================================
-- 1. CHECK CURRENT VERIFICATION STATUS
-- ============================================

-- Check the current verification status of the test account
SELECT 'Current verification status' as status,
       id,
       email,
       company_name,
       verification_status,
       terms_accepted,
       rights_authority_declaration_accepted,
       created_at
FROM rights_holders
WHERE id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc';

-- ============================================
-- 2. SHOW ALL RIGHTS HOLDERS FOR REFERENCE
-- ============================================

-- List all rights holders to see the full picture
SELECT 'All rights holders' as status,
       id,
       email,
       company_name,
       verification_status,
       terms_accepted,
       rights_authority_declaration_accepted,
       created_at
FROM rights_holders
ORDER BY created_at DESC;

-- ============================================
-- 3. OPTIONS TO FIX VERIFICATION STATUS
-- ============================================

-- Option 1: Update to verified (recommended for testing)
-- Uncomment the line below if you want to set the account to verified
-- UPDATE rights_holders SET verification_status = 'verified' WHERE id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc';

-- Option 2: Update to approved (alternative)
-- Uncomment the line below if you want to set the account to approved
-- UPDATE rights_holders SET verification_status = 'approved' WHERE id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc';

-- ============================================
-- 4. VERIFY THE FIX
-- ============================================

-- Check the updated status (run this after updating)
SELECT 'Updated verification status' as status,
       id,
       email,
       company_name,
       verification_status,
       terms_accepted,
       rights_authority_declaration_accepted
FROM rights_holders
WHERE id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc';

-- ============================================
-- 5. EXPLANATION
-- ============================================

SELECT 'Explanation' as status,
       'The RightsHolderProtectedRoute component checks verification_status.' as message,
       'If status is "pending", it shows the verification message.' as detail1,
       'To access the dashboard, status should be "verified" or "approved".' as detail2,
       'For testing purposes, you can update the status to "verified".' as detail3;
