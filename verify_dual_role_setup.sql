-- Verify Dual Role Setup
-- This script confirms that everything is working correctly

-- 1. Check account types
SELECT 'Account Types for Admin Users:' as info;
SELECT id, email, account_type 
FROM profiles 
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- 2. Check if producer_onboarding feature flag is enabled
SELECT 'Producer Onboarding Feature Flag:' as info;
SELECT client_id, feature_name, is_enabled 
FROM white_label_features 
WHERE feature_name = 'producer_onboarding';

-- 3. Check if producer_applications table has the new columns
SELECT 'Producer Applications Table Structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
AND column_name IN ('instrument_one', 'instrument_one_proficiency', 'records_artists', 'artist_example_link')
ORDER BY ordinal_position;

-- 4. Check if there are any producer applications
SELECT 'Producer Applications Count:' as info;
SELECT COUNT(*) as total_applications FROM producer_applications;

-- 5. Check applications by status
SELECT 'Applications by Status:' as info;
SELECT status, COUNT(*) as count 
FROM producer_applications 
GROUP BY status;

-- 6. Verify the constraint allows dual roles
SELECT 'Account Type Constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname = 'profiles_account_type_check';

-- 7. Test that the dual role is valid
SELECT 'Testing Dual Role Validity:' as info;
SELECT 
    CASE 
        WHEN account_type = 'admin,producer' THEN '✅ Dual role is valid'
        ELSE '❌ Dual role not set correctly'
    END as status,
    email,
    account_type
FROM profiles 
WHERE email = 'knockriobeats@gmail.com'; 