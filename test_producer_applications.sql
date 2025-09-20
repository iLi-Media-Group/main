-- Test script to check producer applications and feature flags

-- Check if producer_onboarding feature flag is enabled
SELECT 'Feature Flag Status:' as info;
SELECT client_id, feature_name, is_enabled 
FROM white_label_features 
WHERE feature_name = 'producer_onboarding';

-- Check if producer_applications table exists and has data
SELECT 'Producer Applications Table:' as info;
SELECT COUNT(*) as total_applications FROM producer_applications;

-- Check if there are any applications with status
SELECT 'Applications by Status:' as info;
SELECT status, COUNT(*) as count 
FROM producer_applications 
GROUP BY status;

-- Check the table structure
SELECT 'Table Structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
ORDER BY ordinal_position; 