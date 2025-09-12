-- Simple Fix for Artist Login Errors
-- Remove problematic parts and focus on essential fixes

-- 1. Insert background assets (without ON CONFLICT)
INSERT INTO background_assets (page, url, "isActive", name, type, file_size) VALUES
    ('client-login', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop', true, 'Client Login Background', 'image', 0)
WHERE NOT EXISTS (SELECT 1 FROM background_assets WHERE page = 'client-login');

INSERT INTO background_assets (page, url, "isActive", name, type, file_size) VALUES
    ('producer-login', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop', true, 'Producer Login Background', 'image', 0)
WHERE NOT EXISTS (SELECT 1 FROM background_assets WHERE page = 'producer-login');

INSERT INTO background_assets (page, url, "isActive", name, type, file_size) VALUES
    ('artist-login', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop', true, 'Artist Login Background', 'image', 0)
WHERE NOT EXISTS (SELECT 1 FROM background_assets WHERE page = 'artist-login');

-- 2. Fix background_assets RLS policy
ALTER TABLE background_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "background_assets_public_read" ON background_assets;
CREATE POLICY "background_assets_public_read" ON background_assets FOR SELECT USING (true);

-- 3. Create artist_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS artist_applications (
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

-- 4. Fix artist_applications RLS policies
ALTER TABLE artist_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "artist_applications_public_read" ON artist_applications;
CREATE POLICY "artist_applications_public_read" ON artist_applications FOR SELECT USING (true);

-- 5. Create simple get_user_favorited_playlists function
CREATE OR REPLACE FUNCTION get_user_favorited_playlists(user_email text)
RETURNS TABLE (
    playlist_id UUID,
    playlist_name VARCHAR(255),
    playlist_description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return empty result if table doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_favorited_playlists') THEN
        RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR(255), NULL::VARCHAR(255), NULL::TIMESTAMP WITH TIME ZONE WHERE false;
        RETURN;
    END IF;
    
    -- Return favorited playlists for the user
    RETURN QUERY
    SELECT 
        fp.playlist_id,
        COALESCE(p.name, '')::VARCHAR(255) as playlist_name,
        COALESCE(p.description, '')::VARCHAR(255) as playlist_description,
        fp.created_at
    FROM user_favorited_playlists fp
    LEFT JOIN playlists p ON fp.playlist_id = p.id
    WHERE fp.user_email = get_user_favorited_playlists.user_email
    ORDER BY fp.created_at DESC;
END;
$$;

-- 6. Create user_favorited_playlists table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_favorited_playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    playlist_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Enable RLS for user_favorited_playlists
ALTER TABLE user_favorited_playlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_favorited_playlists_user_read" ON user_favorited_playlists;
CREATE POLICY "user_favorited_playlists_user_read" ON user_favorited_playlists FOR SELECT USING (user_email = current_user);

-- 8. Test the function
SELECT 'Testing get_user_favorited_playlists function:' as info;
SELECT * FROM get_user_favorited_playlists('test@example.com') LIMIT 1;
