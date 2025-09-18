-- Add RLS policies for track-audio bucket
-- This ensures producers can upload to the bucket

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Producers can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Producers can view their audio files" ON storage.objects;
DROP POLICY IF EXISTS "Producers can delete their audio files" ON storage.objects;

-- Create upload policy
CREATE POLICY "Producers can upload audio files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'track-audio' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'producer'
  )
);

-- Create view policy
CREATE POLICY "Producers can view their audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'track-audio' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create delete policy
CREATE POLICY "Producers can delete their audio files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'track-audio' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 

-- Fix RLS policies for background_assets table
-- Drop existing policies
DROP POLICY IF EXISTS "Public read access for background assets" ON background_assets;
DROP POLICY IF EXISTS "Admin full access for background assets" ON background_assets;

-- Create new policies
CREATE POLICY "Public read access for background assets" ON background_assets
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert background assets" ON background_assets
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update background assets" ON background_assets
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete background assets" ON background_assets
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Fix RLS policies for profiles table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Fix RLS policies for custom_sync_requests table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Users can insert own sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Users can update own sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Producers can view open sync requests" ON custom_sync_requests;

-- Create new policies
CREATE POLICY "Users can view own sync requests" ON custom_sync_requests
FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Users can insert own sync requests" ON custom_sync_requests
FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update own sync requests" ON custom_sync_requests
FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Producers can view open sync requests" ON custom_sync_requests
FOR SELECT USING (
  is_open_request = true OR 
  preferred_producer_id = auth.uid()
);

-- Add policy for producers to insert submissions
CREATE POLICY "Producers can insert sync submissions" ON sync_submissions
FOR INSERT WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "Users can view sync submissions for their requests" ON sync_submissions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM custom_sync_requests csr 
    WHERE csr.id = sync_submissions.sync_request_id 
    AND csr.client_id = auth.uid()
  )
);

CREATE POLICY "Producers can view their own submissions" ON sync_submissions
FOR SELECT USING (auth.uid() = producer_id); 