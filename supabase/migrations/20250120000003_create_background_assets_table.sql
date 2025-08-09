-- Create background_assets table for managing video and image backgrounds
CREATE TABLE IF NOT EXISTS background_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'image')),
  page TEXT NOT NULL,
  isActive BOOLEAN DEFAULT false,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_background_assets_page ON background_assets(page);
CREATE INDEX IF NOT EXISTS idx_background_assets_type ON background_assets(type);
CREATE INDEX IF NOT EXISTS idx_background_assets_active ON background_assets(isActive);
CREATE INDEX IF NOT EXISTS idx_background_assets_created_at ON background_assets(created_at DESC);

-- RLS Policies for background_assets table
ALTER TABLE background_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for background assets" ON background_assets;
CREATE POLICY "Public read access for background assets" ON background_assets
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access for background assets" ON background_assets;
CREATE POLICY "Admin full access for background assets" ON background_assets
FOR ALL USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'admin'
  )
);
