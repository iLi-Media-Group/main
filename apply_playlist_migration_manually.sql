-- Apply Playlist System Migration Manually
-- Run this in Supabase SQL Editor to extend playlist system for all account types

-- First, let's add a new column to track the account type that created the playlist
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS creator_type VARCHAR(50) DEFAULT 'producer';

-- Update existing playlists to have the correct creator_type
UPDATE playlists SET creator_type = 'producer' WHERE creator_type IS NULL;

-- Create a new index for creator_type
CREATE INDEX IF NOT EXISTS idx_playlists_creator_type ON playlists(creator_type);

-- Update RLS policies to support all account types
DROP POLICY IF EXISTS "Producers can manage their own playlists" ON playlists;
CREATE POLICY "Users can manage their own playlists" ON playlists
    FOR ALL USING (auth.uid() = producer_id);

-- Update playlist_tracks policies
DROP POLICY IF EXISTS "Producers can manage tracks in their playlists" ON playlist_tracks;
CREATE POLICY "Users can manage tracks in their playlists" ON playlist_tracks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

-- Update playlist_views policies
DROP POLICY IF EXISTS "Producers can view analytics for their playlists" ON playlist_views;
CREATE POLICY "Users can view analytics for their playlists" ON playlist_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_views.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

-- Update the slug generation function to work with any account type
DROP FUNCTION IF EXISTS generate_playlist_slug(TEXT, UUID);
CREATE OR REPLACE FUNCTION generate_playlist_slug(playlist_name TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert name to slug format
    base_slug := lower(regexp_replace(playlist_name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- If empty after processing, use default
    IF base_slug = '' THEN
        base_slug := 'playlist';
    END IF;
    
    final_slug := base_slug;
    
    -- Check if slug exists and append number if needed
    WHILE EXISTS (SELECT 1 FROM playlists WHERE slug = final_slug AND producer_id = user_id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get playlists by account type
DROP FUNCTION IF EXISTS get_playlists_by_account_type(TEXT);
CREATE OR REPLACE FUNCTION get_playlists_by_account_type(account_type TEXT)
RETURNS TABLE (
    id UUID,
    producer_id UUID,
    name VARCHAR(255),
    description TEXT,
    company_name VARCHAR(255),
    logo_url TEXT,
    photo_url TEXT,
    is_public BOOLEAN,
    slug VARCHAR(100),
    creator_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    tracks_count BIGINT
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
    WHERE p.creator_type = account_type
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get all playlists for a user (regardless of account type)
DROP FUNCTION IF EXISTS get_user_playlists(UUID);
CREATE OR REPLACE FUNCTION get_user_playlists(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    producer_id UUID,
    name VARCHAR(255),
    description TEXT,
    company_name VARCHAR(255),
    logo_url TEXT,
    photo_url TEXT,
    is_public BOOLEAN,
    slug VARCHAR(100),
    creator_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    tracks_count BIGINT
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
    WHERE p.producer_id = user_uuid
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Verify the changes
SELECT 'Migration completed successfully' as status;
