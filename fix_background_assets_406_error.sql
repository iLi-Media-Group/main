-- Fix Background Assets 406 Error
-- This script will fix the "Failed to load resource: the server responded with a status of 406" error
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE BACKGROUND_ASSETS TABLE IF NOT EXISTS
-- ============================================

-- Create background_assets table if it doesn't exist
CREATE TABLE IF NOT EXISTS background_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    page TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_background_assets_page ON background_assets(page);
CREATE INDEX IF NOT EXISTS idx_background_assets_isactive ON background_assets("isActive");
CREATE INDEX IF NOT EXISTS idx_background_assets_created_at ON background_assets(created_at);

-- ============================================
-- 2. ENABLE RLS AND CREATE POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE background_assets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON background_assets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Public read access for background assets" ON background_assets;
DROP POLICY IF EXISTS "Admin full access for background assets" ON background_assets;

-- Create proper RLS policies for background_assets
-- Allow public read access (this is what was causing the 406 error)
CREATE POLICY "Enable read access for all users" ON background_assets
    FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated users only" ON background_assets
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update
CREATE POLICY "Enable update for authenticated users only" ON background_assets
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete
CREATE POLICY "Enable delete for authenticated users only" ON background_assets
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- 3. INSERT DEFAULT BACKGROUND ASSETS
-- ============================================

-- Insert default background assets for common pages
INSERT INTO background_assets (name, url, type, page, "isActive") VALUES
    ('Default Producer Login Video', 'https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761', 'video', 'producer-login', true),
    ('Default Producer Login Image', 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=1920&q=80', 'image', 'producer-login', true),
    ('Default Client Login Video', 'https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761', 'video', 'client-login', true),
    ('Default Client Login Image', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1920&q=80', 'image', 'client-login', true),
    ('Default White Label Login Video', 'https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761', 'video', 'white-label-login', true),
    ('Default White Label Login Image', 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=1920&q=80', 'image', 'white-label-login', true),
    ('Default Hero Video', 'https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761', 'video', 'hero', true),
    ('Default Hero Image', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1920&q=80', 'image', 'hero', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. VERIFICATION QUERIES
-- ============================================

-- Verify the table was created
SELECT 'Background assets table created successfully' as status;

-- Show table structure
SELECT 'Table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'background_assets' 
ORDER BY ordinal_position;

-- Test the query that was failing
SELECT 'Testing the failing query:' as info;
SELECT 
    id,
    name,
    url,
    type,
    page,
    "isActive",
    created_at
FROM background_assets 
WHERE page = 'producer-login' 
AND "isActive" = true 
ORDER BY created_at DESC 
LIMIT 1;

-- Show RLS policies
SELECT 'RLS policies:' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'background_assets';

-- Show all background assets
SELECT 'All background assets:' as info;
SELECT 
    id,
    name,
    url,
    type,
    page,
    "isActive",
    created_at
FROM background_assets 
ORDER BY page, created_at DESC;

-- ============================================
-- 5. FINAL STATUS
-- ============================================

SELECT 'Background assets 406 error fix complete!' as final_status;
SELECT 'The VideoBackground component should now work without 406 errors.' as next_steps;
