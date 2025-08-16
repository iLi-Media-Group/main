-- Force Enable Producer Applications
-- This script ensures the producer applications feature is enabled

-- 1. Make sure the feature flag is enabled globally
UPDATE white_label_features 
SET is_enabled = true 
WHERE feature_name = 'producer_onboarding';

-- 2. Insert the feature flag if it doesn't exist
INSERT INTO white_label_features (client_id, feature_name, is_enabled)
VALUES (NULL, 'producer_onboarding', true)
ON CONFLICT (client_id, feature_name) 
DO UPDATE SET is_enabled = true;

-- 3. Also enable it for your specific user (if needed)
INSERT INTO white_label_features (client_id, feature_name, is_enabled)
SELECT p.id, 'producer_onboarding', true
FROM profiles p
WHERE p.email = 'knockriobeats@gmail.com'
ON CONFLICT (client_id, feature_name) 
DO UPDATE SET is_enabled = true;

-- 4. Verify the feature flag is enabled
SELECT 'Feature Flag Status After Update:' as info;
SELECT client_id, feature_name, is_enabled 
FROM white_label_features 
WHERE feature_name = 'producer_onboarding';

-- 5. Check your account type again
SELECT 'Your Account Type:' as info;
SELECT id, email, account_type 
FROM profiles 
WHERE email = 'knockriobeats@gmail.com'; 