-- Fix Remaining Database Issues
-- This script addresses 406 errors for background_assets and 400 errors for sync_submissions

-- 1. Fix background_assets RLS policies (406 errors)
DROP POLICY IF EXISTS "Enable read access for all users" ON background_assets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON background_assets;

-- Create proper RLS policies for background_assets
CREATE POLICY "Enable read access for all users" ON background_assets
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON background_assets
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users only" ON background_assets
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users only" ON background_assets
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- 2. Fix sync_submissions RLS policies (400 errors)
DROP POLICY IF EXISTS "Enable read access for all users" ON sync_submissions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON sync_submissions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON sync_submissions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON sync_submissions;

-- Create proper RLS policies for sync_submissions
CREATE POLICY "Enable read access for all users" ON sync_submissions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON sync_submissions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users only" ON sync_submissions
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users only" ON sync_submissions
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- 3. Ensure sync_submissions table has the correct structure
-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add selected column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sync_submissions' AND column_name = 'selected') THEN
        ALTER TABLE sync_submissions ADD COLUMN selected BOOLEAN DEFAULT false;
    END IF;
    
    -- Add track_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sync_submissions' AND column_name = 'track_url') THEN
        ALTER TABLE sync_submissions ADD COLUMN track_url TEXT;
    END IF;
    
    -- Add producer_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sync_submissions' AND column_name = 'producer_id') THEN
        ALTER TABLE sync_submissions ADD COLUMN producer_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add sync_request_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sync_submissions' AND column_name = 'sync_request_id') THEN
        ALTER TABLE sync_submissions ADD COLUMN sync_request_id UUID REFERENCES custom_sync_requests(id);
    END IF;
END $$;

-- 4. Fix any other potential RLS issues with related tables
-- Fix custom_sync_requests RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON custom_sync_requests;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON custom_sync_requests;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON custom_sync_requests;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON custom_sync_requests;

CREATE POLICY "Enable read access for all users" ON custom_sync_requests
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON custom_sync_requests
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users only" ON custom_sync_requests
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users only" ON custom_sync_requests
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- 5. Fix profiles table RLS policies (if still having issues)
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON profiles;

CREATE POLICY "Enable read access for all users" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users only" ON profiles
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users only" ON profiles
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- 6. Verify the fixes
SELECT 'background_assets policies:' as table_name, count(*) as policy_count 
FROM pg_policies WHERE tablename = 'background_assets'
UNION ALL
SELECT 'sync_submissions policies:' as table_name, count(*) as policy_count 
FROM pg_policies WHERE tablename = 'sync_submissions'
UNION ALL
SELECT 'custom_sync_requests policies:' as table_name, count(*) as policy_count 
FROM pg_policies WHERE tablename = 'custom_sync_requests'
UNION ALL
SELECT 'profiles policies:' as table_name, count(*) as policy_count 
FROM pg_policies WHERE tablename = 'profiles';

-- 7. Check if background_assets table exists and has data
SELECT 'background_assets count:' as info, count(*) as count FROM background_assets;

-- 8. Check sync_submissions structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sync_submissions' 
ORDER BY ordinal_position;
