-- Comprehensive fix for database issues causing 406 and 409 errors

-- 1. Fix RLS policies for background_assets table
DROP POLICY IF EXISTS "Public read access for background assets" ON background_assets;
DROP POLICY IF EXISTS "Admin full access for background assets" ON background_assets;

CREATE POLICY "Public read access for background assets" ON background_assets
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert background assets" ON background_assets
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update background assets" ON background_assets
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete background assets" ON background_assets
FOR DELETE USING (auth.uid() IS NOT NULL);

-- 2. Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Fix RLS policies for custom_sync_requests table
DROP POLICY IF EXISTS "Users can view own sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Users can insert own sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Users can update own sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Producers can view open sync requests" ON custom_sync_requests;

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

-- 4. Fix RLS policies for sync_submissions table
DROP POLICY IF EXISTS "Producers can insert sync submissions" ON sync_submissions;
DROP POLICY IF EXISTS "Users can view sync submissions for their requests" ON sync_submissions;
DROP POLICY IF EXISTS "Producers can view their own submissions" ON sync_submissions;

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

-- 5. Add missing columns to custom_sync_requests if they don't exist
DO $$ 
BEGIN
    -- Add submission_email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'submission_email'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN submission_email TEXT;
    END IF;
    
    -- Add payment_terms column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'payment_terms'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN payment_terms TEXT DEFAULT 'immediate';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'status'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN status TEXT DEFAULT 'open';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 6. Ensure sync_submissions table has proper structure
DO $$ 
BEGIN
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sync_submissions' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE sync_submissions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add has_mp3 column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sync_submissions' AND column_name = 'has_mp3'
    ) THEN
        ALTER TABLE sync_submissions ADD COLUMN has_mp3 BOOLEAN DEFAULT false;
    END IF;
    
    -- Add has_stems column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sync_submissions' AND column_name = 'has_stems'
    ) THEN
        ALTER TABLE sync_submissions ADD COLUMN has_stems BOOLEAN DEFAULT false;
    END IF;
    
    -- Add has_trackouts column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sync_submissions' AND column_name = 'has_trackouts'
    ) THEN
        ALTER TABLE sync_submissions ADD COLUMN has_trackouts BOOLEAN DEFAULT false;
    END IF;
END $$;
