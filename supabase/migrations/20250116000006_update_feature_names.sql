-- Update feature names to match new naming convention
-- First, delete old feature names
DELETE FROM white_label_features WHERE feature_name IN ('ai_recommendations', 'producer_applications');

-- Insert new feature names
INSERT INTO white_label_features (client_id, feature_name, is_enabled) VALUES
  (NULL, 'ai_search_assistance', false),
  (NULL, 'producer_onboarding', false),
  (NULL, 'deep_media_search', false)
ON CONFLICT DO NOTHING;

-- Update the get_feature_status function to handle the new feature names
CREATE OR REPLACE FUNCTION get_feature_status(feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  is_enabled BOOLEAN;
BEGIN
  -- Check if user has specific feature enabled
  SELECT wlf.is_enabled INTO is_enabled
  FROM white_label_features wlf
  WHERE wlf.client_id = auth.uid() 
    AND wlf.feature_name = get_feature_status.feature_name;
  
  -- If no specific setting found, check global default
  IF is_enabled IS NULL THEN
    SELECT wlf.is_enabled INTO is_enabled
    FROM white_label_features wlf
    WHERE wlf.client_id IS NULL 
      AND wlf.feature_name = get_feature_status.feature_name;
  END IF;
  
  RETURN COALESCE(is_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 