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

-- Create storage buckets for background assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('background-videos', 'background-videos', false, 52428800, ARRAY['video/mp4', 'video/webm', 'video/ogg'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('background-images', 'background-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for background-videos bucket
DROP POLICY IF EXISTS "Public read access for background videos" ON storage.objects;
CREATE POLICY "Public read access for background videos" ON storage.objects
FOR SELECT USING (bucket_id = 'background-videos');

DROP POLICY IF EXISTS "Admin upload access for background videos" ON storage.objects;
CREATE POLICY "Admin upload access for background videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'background-videos' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'admin'
  )
);

DROP POLICY IF EXISTS "Admin delete access for background videos" ON storage.objects;
CREATE POLICY "Admin delete access for background videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'background-videos' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'admin'
  )
);

-- RLS Policies for background-images bucket
DROP POLICY IF EXISTS "Public read access for background images" ON storage.objects;
CREATE POLICY "Public read access for background images" ON storage.objects
FOR SELECT USING (bucket_id = 'background-images');

DROP POLICY IF EXISTS "Admin upload access for background images" ON storage.objects;
CREATE POLICY "Admin upload access for background images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'background-images' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'admin'
  )
);

DROP POLICY IF EXISTS "Admin delete access for background images" ON storage.objects;
CREATE POLICY "Admin delete access for background images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'background-images' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'admin'
  )
);

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
