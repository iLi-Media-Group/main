-- Enable producer_onboarding feature flag for the main site
-- This will allow admin users to access the producer applications feature

-- Update the global feature flag to enable producer onboarding
UPDATE white_label_features 
SET is_enabled = true 
WHERE client_id IS NULL 
AND feature_name = 'producer_onboarding';

-- If the record doesn't exist, insert it
INSERT INTO white_label_features (client_id, feature_name, is_enabled)
VALUES (NULL, 'producer_onboarding', true)
ON CONFLICT (client_id, feature_name) 
DO UPDATE SET is_enabled = true; 