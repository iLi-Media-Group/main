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
