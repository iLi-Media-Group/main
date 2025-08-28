-- Apply Playlist System Migration Manually
-- This fixes the playlist viewing and catalog browser issues

-- Add creator_type column to playlists table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'playlists' AND column_name = 'creator_type') THEN
        ALTER TABLE playlists ADD COLUMN creator_type TEXT DEFAULT 'producer';
    END IF;
END $$;

-- Update existing playlists to have creator_type
UPDATE playlists SET creator_type = 'producer' WHERE creator_type IS NULL;

-- Create or replace the generate_playlist_slug function
DROP FUNCTION IF EXISTS generate_playlist_slug(text, uuid);
CREATE OR REPLACE FUNCTION generate_playlist_slug(playlist_name text, user_id uuid)
RETURNS text AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
BEGIN
    -- Convert name to slug format
    base_slug := lower(regexp_replace(playlist_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    
    -- If empty after conversion, use default
    IF base_slug = '' THEN
        base_slug := 'playlist';
    END IF;
    
    final_slug := base_slug;
    
    -- Check if slug exists and generate unique one
    WHILE EXISTS (SELECT 1 FROM playlists WHERE slug = final_slug AND producer_id != user_id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the get_playlists_by_account_type function
DROP FUNCTION IF EXISTS get_playlists_by_account_type(text, uuid);
CREATE OR REPLACE FUNCTION get_playlists_by_account_type(account_type text, user_id uuid)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    slug text,
    is_public boolean,
    creator_type text,
    created_at timestamptz,
    updated_at timestamptz,
    producer_id uuid,
    company_name text,
    logo_url text,
    photo_url text,
    tracks_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.slug,
        p.is_public,
        p.creator_type,
        p.created_at,
        p.updated_at,
        p.producer_id,
        p.company_name,
        p.logo_url,
        p.photo_url,
        COALESCE(track_counts.count, 0) as tracks_count
    FROM playlists p
    LEFT JOIN (
        SELECT playlist_id, COUNT(*) as count
        FROM playlist_tracks
        GROUP BY playlist_id
    ) track_counts ON p.id = track_counts.playlist_id
    WHERE p.producer_id = user_id 
    AND p.creator_type = account_type
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the get_user_playlists function
DROP FUNCTION IF EXISTS get_user_playlists(uuid);
CREATE OR REPLACE FUNCTION get_user_playlists(user_id uuid)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    slug text,
    is_public boolean,
    creator_type text,
    created_at timestamptz,
    updated_at timestamptz,
    producer_id uuid,
    company_name text,
    logo_url text,
    photo_url text,
    tracks_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.slug,
        p.is_public,
        p.creator_type,
        p.created_at,
        p.updated_at,
        p.producer_id,
        p.company_name,
        p.logo_url,
        p.photo_url,
        COALESCE(track_counts.count, 0) as tracks_count
    FROM playlists p
    LEFT JOIN (
        SELECT playlist_id, COUNT(*) as count
        FROM playlist_tracks
        GROUP BY playlist_id
    ) track_counts ON p.id = track_counts.playlist_id
    WHERE p.producer_id = user_id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for playlists table
DROP POLICY IF EXISTS "Users can view their own playlists" ON playlists;
CREATE POLICY "Users can view their own playlists" ON playlists
    FOR SELECT USING (auth.uid() = producer_id);

DROP POLICY IF EXISTS "Users can view public playlists" ON playlists;
CREATE POLICY "Users can view public playlists" ON playlists
    FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can insert their own playlists" ON playlists;
CREATE POLICY "Users can insert their own playlists" ON playlists
    FOR INSERT WITH CHECK (auth.uid() = producer_id);

DROP POLICY IF EXISTS "Users can update their own playlists" ON playlists;
CREATE POLICY "Users can update their own playlists" ON playlists
    FOR UPDATE USING (auth.uid() = producer_id);

DROP POLICY IF EXISTS "Users can delete their own playlists" ON playlists;
CREATE POLICY "Users can delete their own playlists" ON playlists
    FOR DELETE USING (auth.uid() = producer_id);

-- Update RLS policies for playlist_tracks table
DROP POLICY IF EXISTS "Users can view tracks in their playlists" ON playlist_tracks;
CREATE POLICY "Users can view tracks in their playlists" ON playlist_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view tracks in public playlists" ON playlist_tracks;
CREATE POLICY "Users can view tracks in public playlists" ON playlist_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.is_public = true
        )
    );

DROP POLICY IF EXISTS "Users can insert tracks in their playlists" ON playlist_tracks;
CREATE POLICY "Users can insert tracks in their playlists" ON playlist_tracks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update tracks in their playlists" ON playlist_tracks;
CREATE POLICY "Users can update tracks in their playlists" ON playlist_tracks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete tracks in their playlists" ON playlist_tracks;
CREATE POLICY "Users can delete tracks in their playlists" ON playlist_tracks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

-- Ensure RLS is enabled
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Add service role policies for Edge Functions
DROP POLICY IF EXISTS "Service role can manage playlists" ON playlists;
CREATE POLICY "Service role can manage playlists" ON playlists
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage playlist tracks" ON playlist_tracks;
CREATE POLICY "Service role can manage playlist tracks" ON playlist_tracks
    FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlists_creator_type ON playlists(creator_type);
CREATE INDEX IF NOT EXISTS idx_playlists_slug ON playlists(slug);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id);

-- Update existing playlists to ensure they have slugs
UPDATE playlists 
SET slug = generate_playlist_slug(name, producer_id)
WHERE slug IS NULL OR slug = '';

-- Ensure all playlists have a creator_type
UPDATE playlists SET creator_type = 'producer' WHERE creator_type IS NULL;

COMMIT;
