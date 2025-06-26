-- Create feature flags table for White Label clients
CREATE TABLE IF NOT EXISTS white_label_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, feature_name)
);

-- Insert default features
INSERT INTO white_label_features (client_id, feature_name, is_enabled) VALUES
  (NULL, 'ai_recommendations', false),
  (NULL, 'producer_applications', false)
ON CONFLICT DO NOTHING;

-- Create RLS policies
ALTER TABLE white_label_features ENABLE ROW LEVEL SECURITY;

-- Admins can manage all feature flags
CREATE POLICY "Admins can manage all feature flags" ON white_label_features
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- White label clients can view their own feature flags
CREATE POLICY "White label clients can view their feature flags" ON white_label_features
  FOR SELECT USING (
    client_id = auth.uid() OR client_id IS NULL
  );

-- Create function to get feature status
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

-- Create function to update feature status
CREATE OR REPLACE FUNCTION update_feature_status(
  target_client_id UUID,
  feature_name TEXT,
  is_enabled BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  -- Only admins can update feature flags
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update feature flags';
  END IF;
  
  INSERT INTO white_label_features (client_id, feature_name, is_enabled)
  VALUES (target_client_id, update_feature_status.feature_name, update_feature_status.is_enabled)
  ON CONFLICT (client_id, feature_name)
  DO UPDATE SET 
    is_enabled = update_feature_status.is_enabled,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 