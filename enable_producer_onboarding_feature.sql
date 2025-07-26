-- Enable producer_onboarding feature flag for admin access
-- This ensures that admin users can access producer applications

-- Enable the feature flag globally
UPDATE white_label_features 
SET is_enabled = true 
WHERE client_id IS NULL 
AND feature_name = 'producer_onboarding';

-- If the record doesn't exist, insert it
INSERT INTO white_label_features (client_id, feature_name, is_enabled)
VALUES (NULL, 'producer_onboarding', true)
ON CONFLICT (client_id, feature_name) 
DO UPDATE SET is_enabled = true;

-- Verify the feature flag is enabled
SELECT 'Producer Onboarding Feature Flag Status:' as info;
SELECT client_id, feature_name, is_enabled 
FROM white_label_features 
WHERE feature_name = 'producer_onboarding'; 