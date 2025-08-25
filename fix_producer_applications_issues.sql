-- Fix Producer Applications Issues
-- This script addresses the feature flag and admin account type issues

-- 1. Enable producer_onboarding feature flag globally
UPDATE white_label_features 
SET is_enabled = true 
WHERE client_id IS NULL 
AND feature_name = 'producer_onboarding';

-- If the record doesn't exist, insert it
INSERT INTO white_label_features (client_id, feature_name, is_enabled)
VALUES (NULL, 'producer_onboarding', true)
ON CONFLICT (client_id, feature_name) 
DO UPDATE SET is_enabled = true;

-- 2. Fix admin account types for main admin users
UPDATE profiles 
SET account_type = 'admin'
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- 3. Verify the changes
SELECT 'Feature Flag Status:' as info;
SELECT client_id, feature_name, is_enabled 
FROM white_label_features 
WHERE feature_name = 'producer_onboarding';

SELECT 'Admin Account Types:' as info;
SELECT id, email, account_type 
FROM profiles 
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- 4. Check if producer_applications table has the new columns
SELECT 'Producer Applications Table Structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
AND column_name IN ('instrument_one', 'instrument_one_proficiency', 'records_artists', 'artist_example_link')
ORDER BY ordinal_position;

-- 5. Check if there are any applications
SELECT 'Producer Applications Count:' as info;
SELECT COUNT(*) as total_applications FROM producer_applications; 