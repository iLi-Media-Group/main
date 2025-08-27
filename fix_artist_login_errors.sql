-- Fix Artist Login Errors - Comprehensive Database Fix
-- Addresses 406 errors for background_assets and artist_applications
-- Addresses 400 errors for get_user_favorited_playlists function

-- 1. Fix background_assets table and ensure it exists with proper RLS policies
DO $$ 
BEGIN
    -- Create background_assets table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'background_assets') THEN
        CREATE TABLE background_assets (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            page VARCHAR(50) NOT NULL,
            image_url TEXT NOT NULL,
            isActive BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 2. Check and fix background_assets table structure if needed
DO $$ 
BEGIN
    -- Add image_url column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'background_assets' AND column_name = 'image_url') THEN
        ALTER TABLE background_assets ADD COLUMN image_url TEXT;
    END IF;
    
    -- Add isActive column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'background_assets' AND column_name = 'isActive') THEN
        ALTER TABLE background_assets ADD COLUMN isActive BOOLEAN DEFAULT true;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'background_assets' AND column_name = 'created_at') THEN
        ALTER TABLE background_assets ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'background_assets' AND column_name = 'updated_at') THEN
        ALTER TABLE background_assets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. Ensure RLS is enabled and policies are set up for background_assets
ALTER TABLE background_assets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "background_assets_public_read" ON background_assets;

-- Create public read policy for background_assets
CREATE POLICY "background_assets_public_read" ON background_assets
    FOR SELECT USING (true);

-- 4. Insert default background assets for all required pages (only if they don't exist)
INSERT INTO background_assets (page, image_url, isActive) VALUES
    ('client-login', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop', true),
    ('producer-login', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop', true),
    ('artist-login', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop', true),
    ('home', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop', true),
    ('catalog', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop', true)
ON CONFLICT (page) DO NOTHING;

-- 5. Fix artist_applications table and ensure it exists with proper RLS policies
DO $$ 
BEGIN
    -- Create artist_applications table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'artist_applications') THEN
        CREATE TABLE artist_applications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            artist_name VARCHAR(255),
            genre VARCHAR(100),
            sub_genre VARCHAR(100),
            bio TEXT,
            social_media_links JSONB,
            status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'approved', 'invited', 'onboarded')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 6. Ensure RLS is enabled and policies are set up for artist_applications
ALTER TABLE artist_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "artist_applications_public_read" ON artist_applications;
DROP POLICY IF EXISTS "artist_applications_user_read" ON artist_applications;
DROP POLICY IF EXISTS "artist_applications_user_insert" ON artist_applications;
DROP POLICY IF EXISTS "artist_applications_user_update" ON artist_applications;

-- Create policies for artist_applications
CREATE POLICY "artist_applications_public_read" ON artist_applications
    FOR SELECT USING (true);

CREATE POLICY "artist_applications_user_read" ON artist_applications
    FOR SELECT USING (email = current_user);

CREATE POLICY "artist_applications_user_insert" ON artist_applications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "artist_applications_user_update" ON artist_applications
    FOR UPDATE USING (email = current_user);

-- 7. Fix get_user_favorited_playlists function
CREATE OR REPLACE FUNCTION get_user_favorited_playlists(user_email text)
RETURNS TABLE (
    playlist_id UUID,
    playlist_name TEXT,
    playlist_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user_favorited_playlists table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_favorited_playlists') THEN
        -- Return empty result if table doesn't exist
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMP WITH TIME ZONE WHERE false;
        RETURN;
    END IF;
    
    -- Return favorited playlists for the user
    RETURN QUERY
    SELECT 
        fp.playlist_id,
        p.name as playlist_name,
        p.description as playlist_description,
        fp.created_at
    FROM user_favorited_playlists fp
    LEFT JOIN playlists p ON fp.playlist_id = p.id
    WHERE fp.user_email = get_user_favorited_playlists.user_email
    ORDER BY fp.created_at DESC;
END;
$$;

-- 8. Ensure user_favorited_playlists table exists (if needed)
DO $$ 
BEGIN
    -- Create user_favorited_playlists table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_favorited_playlists') THEN
        CREATE TABLE user_favorited_playlists (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            playlist_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE user_favorited_playlists ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "user_favorited_playlists_user_read" ON user_favorited_playlists
            FOR SELECT USING (user_email = current_user);
            
        CREATE POLICY "user_favorited_playlists_user_insert" ON user_favorited_playlists
            FOR INSERT WITH CHECK (user_email = current_user);
            
        CREATE POLICY "user_favorited_playlists_user_delete" ON user_favorited_playlists
            FOR DELETE USING (user_email = current_user);
    END IF;
END $$;

-- 9. Verify the fixes
SELECT 'background_assets table check:' as info;
SELECT COUNT(*) as background_assets_count FROM background_assets;

SELECT 'artist_applications table check:' as info;
SELECT COUNT(*) as artist_applications_count FROM artist_applications;

SELECT 'user_favorited_playlists table check:' as info;
SELECT COUNT(*) as user_favorited_playlists_count FROM user_favorited_playlists;

-- Test the function
SELECT 'Testing get_user_favorited_playlists function:' as info;
SELECT * FROM get_user_favorited_playlists('test@example.com') LIMIT 1;
