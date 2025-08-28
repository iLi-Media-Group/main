-- Create Producer Welcome Drip Campaign Table
CREATE TABLE IF NOT EXISTS producer_welcome_drip_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  account_type TEXT NOT NULL DEFAULT 'producer', -- 'producer', 'artist_band', 'rights_holder'
  current_week INTEGER DEFAULT 0,
  next_send_at TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_producer_welcome_drip_next_send_at 
ON producer_welcome_drip_subscriptions(next_send_at);

-- Enable RLS
ALTER TABLE producer_welcome_drip_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own producer drip subscriptions" ON producer_welcome_drip_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage producer drip subscriptions" ON producer_welcome_drip_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_producer_welcome_drip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_producer_welcome_drip_updated_at
  BEFORE UPDATE ON producer_welcome_drip_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_producer_welcome_drip_updated_at();
