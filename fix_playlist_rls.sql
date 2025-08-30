-- Fix RLS policies for playlist access
-- Run this in the Supabase SQL Editor

-- 1. Check current RLS policies on playlists table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'playlists';

-- 2. Check current RLS policies on profiles table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Check if RLS is enabled on both tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('playlists', 'profiles');

-- 4. Add missing RLS policies for public access to playlists (if they don't exist)
-- This ensures anonymous users can access public playlists
DO $$
BEGIN
    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'playlists' 
        AND policyname = 'Anyone can view public playlists'
    ) THEN
        CREATE POLICY "Anyone can view public playlists" ON playlists
        FOR SELECT USING (is_public = true);
    END IF;
END $$;

-- 5. Add missing RLS policies for public access to profiles (if they don't exist)
-- This ensures the creator profile can be fetched for public playlists
DO $$
BEGIN
    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Anyone can view profiles for public playlists'
    ) THEN
        CREATE POLICY "Anyone can view profiles for public playlists" ON profiles
        FOR SELECT USING (true);
    END IF;
END $$;

-- 6. Add missing RLS policies for playlist_tracks (if they don't exist)
-- This ensures tracks can be fetched for public playlists
DO $$
BEGIN
    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'playlist_tracks' 
        AND policyname = 'Anyone can view tracks in public playlists'
    ) THEN
        CREATE POLICY "Anyone can view tracks in public playlists" ON playlist_tracks
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM playlists 
                WHERE playlists.id = playlist_tracks.playlist_id 
                AND playlists.is_public = true
            )
        );
    END IF;
END $$;

-- 7. Add service role policies for all tables (if they don't exist)
-- This ensures the application can access data with service role
DO $$
BEGIN
    -- Playlists service role policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'playlists' 
        AND policyname = 'Service role can access all playlists'
    ) THEN
        CREATE POLICY "Service role can access all playlists" ON playlists
        FOR ALL USING (auth.role() = 'service_role');
    END IF;
    
    -- Profiles service role policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Service role can access all profiles'
    ) THEN
        CREATE POLICY "Service role can access all profiles" ON profiles
        FOR ALL USING (auth.role() = 'service_role');
    END IF;
    
    -- Playlist tracks service role policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'playlist_tracks' 
        AND policyname = 'Service role can access all playlist tracks'
    ) THEN
        CREATE POLICY "Service role can access all playlist tracks" ON playlist_tracks
        FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- 8. Test the access after applying policies
SELECT 
    id,
    name,
    slug,
    is_public,
    creator_type,
    producer_id
FROM playlists 
WHERE slug = 'john-sama/test-list';
