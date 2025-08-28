-- Manual SQL script to apply playlist system migration
-- Run this in your Supabase SQL Editor

-- 1. Add creator_type column to playlists table
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS creator_type TEXT DEFAULT 'producer';

-- 2. Update existing playlists to have creator_type
UPDATE playlists SET creator_type = 'producer' WHERE creator_type IS NULL;

-- 3. Drop existing functions if they exist to avoid parameter conflicts
DROP FUNCTION IF EXISTS generate_playlist_slug(text, uuid);
DROP FUNCTION IF EXISTS get_playlists_by_account_type(text, uuid);
DROP FUNCTION IF EXISTS get_user_playlists(uuid, text);

-- 4. Create or replace the generate_playlist_slug function
CREATE OR REPLACE FUNCTION generate_playlist_slug(playlist_name text, user_id uuid)
RETURNS text AS $$
DECLARE
    producer_name text;
    producer_slug text;
    playlist_slug text;
    base_slug text;
    final_slug text;
    unique_slug text;
    counter integer := 0;
BEGIN
    -- Get producer name
    SELECT 
        CASE 
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
            WHEN first_name IS NOT NULL THEN first_name
            ELSE split_part(email, '@', 1)
        END INTO producer_name
    FROM profiles 
    WHERE id = user_id;
    
    -- Generate producer slug
    producer_slug := lower(regexp_replace(producer_name, '[^a-z0-9\s-]', '', 'g'));
    producer_slug := regexp_replace(producer_slug, '\s+', '-', 'g');
    producer_slug := trim(producer_slug);
    
    -- Generate playlist slug
    playlist_slug := lower(regexp_replace(playlist_name, '[^a-z0-9\s-]', '', 'g'));
    playlist_slug := regexp_replace(playlist_slug, '\s+', '-', 'g');
    playlist_slug := trim(playlist_slug);
    
    base_slug := producer_slug || '/' || playlist_slug;
    final_slug := COALESCE(base_slug, producer_slug || '/playlist');
    
    -- Check for uniqueness and append number if needed
    unique_slug := final_slug;
    WHILE EXISTS (
        SELECT 1 FROM playlists 
        WHERE slug = unique_slug AND producer_id = user_id
    ) LOOP
        counter := counter + 1;
        unique_slug := final_slug || '-' || counter;
    END LOOP;
    
    RETURN unique_slug;
END;
$$ LANGUAGE plpgsql;

-- 5. Create or replace the get_playlists_by_account_type function
CREATE OR REPLACE FUNCTION get_playlists_by_account_type(account_type text, user_id uuid)
RETURNS TABLE (
    id uuid,
    producer_id uuid,
    name text,
    description text,
    company_name text,
    logo_url text,
    photo_url text,
    is_public boolean,
    slug text,
    creator_type text,
    created_at timestamptz,
    updated_at timestamptz,
    tracks_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.producer_id,
        p.name,
        p.description,
        p.company_name,
        p.logo_url,
        p.photo_url,
        p.is_public,
        p.slug,
        p.creator_type,
        p.created_at,
        p.updated_at,
        COALESCE(pt.track_count, 0) as tracks_count
    FROM playlists p
    LEFT JOIN (
        SELECT playlist_id, COUNT(*) as track_count
        FROM playlist_tracks
        GROUP BY playlist_id
    ) pt ON p.id = pt.playlist_id
    WHERE p.producer_id = user_id 
    AND p.creator_type = account_type
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Create or replace the get_user_playlists function
CREATE OR REPLACE FUNCTION get_user_playlists(user_id uuid, account_type text DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    producer_id uuid,
    name text,
    description text,
    company_name text,
    logo_url text,
    photo_url text,
    is_public boolean,
    slug text,
    creator_type text,
    created_at timestamptz,
    updated_at timestamptz,
    tracks_count bigint
) AS $$
BEGIN
    IF account_type IS NULL THEN
        RETURN QUERY
        SELECT 
            p.id,
            p.producer_id,
            p.name,
            p.description,
            p.company_name,
            p.logo_url,
            p.photo_url,
            p.is_public,
            p.slug,
            p.creator_type,
            p.created_at,
            p.updated_at,
            COALESCE(pt.track_count, 0) as tracks_count
        FROM playlists p
        LEFT JOIN (
            SELECT playlist_id, COUNT(*) as track_count
            FROM playlist_tracks
            GROUP BY playlist_id
        ) pt ON p.id = pt.playlist_id
        WHERE p.producer_id = user_id
        ORDER BY p.created_at DESC;
    ELSE
        RETURN QUERY
        SELECT * FROM get_playlists_by_account_type(account_type, user_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. Update RLS policies for playlists table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can view public playlists" ON playlists;
DROP POLICY IF EXISTS "Users can create their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete their own playlists" ON playlists;

-- Create new policies that support all account types
CREATE POLICY "Users can view their own playlists" ON playlists
    FOR SELECT USING (producer_id = auth.uid());

CREATE POLICY "Users can view public playlists" ON playlists
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own playlists" ON playlists
    FOR INSERT WITH CHECK (producer_id = auth.uid());

CREATE POLICY "Users can update their own playlists" ON playlists
    FOR UPDATE USING (producer_id = auth.uid());

CREATE POLICY "Users can delete their own playlists" ON playlists
    FOR DELETE USING (producer_id = auth.uid());

-- 8. Update RLS policies for playlist_tracks table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view tracks in their own playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can view tracks in public playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can add tracks to their own playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can remove tracks from their own playlists" ON playlist_tracks;

-- Create new policies that support all account types
CREATE POLICY "Users can view tracks in their own playlists" ON playlist_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

CREATE POLICY "Users can view tracks in public playlists" ON playlist_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.is_public = true
        )
    );

CREATE POLICY "Users can add tracks to their own playlists" ON playlist_tracks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove tracks from their own playlists" ON playlist_tracks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

-- 9. Add service role policies for admin access
CREATE POLICY "Service role can access all playlists" ON playlists
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all playlist tracks" ON playlist_tracks
    FOR ALL USING (auth.role() = 'service_role');

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_playlists_creator_type ON playlists(creator_type);
CREATE INDEX IF NOT EXISTS idx_playlists_slug ON playlists(slug);
CREATE INDEX IF NOT EXISTS idx_playlists_producer_creator ON playlists(producer_id, creator_type);

-- 11. Ensure all playlists have slugs
UPDATE playlists 
SET slug = generate_playlist_slug(name, producer_id)
WHERE slug IS NULL OR slug = '';

-- 12. Ensure all playlists have creator_type
UPDATE playlists 
SET creator_type = 'producer' 
WHERE creator_type IS NULL;

-- Verify the migration
SELECT 'Migration completed successfully' as status;
