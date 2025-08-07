-- Fix the net.http_post issue by temporarily disabling problematic triggers
-- This will allow track uploads to work while we fix the underlying issue

-- First, let's see what triggers exist on the tracks table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'tracks'
ORDER BY trigger_name;

-- Check if the net extension is installed
SELECT * FROM pg_extension WHERE extname = 'net';

-- If net extension is not installed, we need to install it
-- CREATE EXTENSION IF NOT EXISTS "net" WITH SCHEMA "extensions";

-- Let's identify which specific triggers are causing the issue
-- We'll only disable user-created triggers, not system triggers
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_timing,
    t.action_statement,
    t.action_orientation,
    p.proname as function_name
FROM information_schema.triggers t
JOIN pg_trigger tr ON t.trigger_name = tr.tgname
JOIN pg_proc p ON tr.tgfoid = p.oid
WHERE t.event_object_table = 'tracks'
  AND tr.tgisinternal = false  -- Only user-created triggers
ORDER BY t.trigger_name;

-- Disable specific user-created triggers that might be calling net.http_post
-- We'll identify them by name pattern or function content
-- For now, let's try to disable triggers that might be related to our problematic functions

-- Check if any of our problematic functions are being called by triggers
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_timing,
    p.proname as function_name
FROM information_schema.triggers t
JOIN pg_trigger tr ON t.trigger_name = tr.tgname
JOIN pg_proc p ON tr.tgfoid = p.oid
WHERE t.event_object_table = 'tracks'
  AND tr.tgisinternal = false
  AND p.proname IN ('call_sync_track', 'notify_algolia', 'notify_track_change', 'notify_track_delete')
ORDER BY t.trigger_name;

-- If we find specific triggers, disable them individually
-- Example (uncomment and modify based on actual trigger names found):
-- ALTER TABLE tracks DISABLE TRIGGER "trigger_name_here";

-- Alternative approach: Drop and recreate the problematic functions with proper error handling
-- This will prevent the functions from failing when net.http_post is not available

-- Drop the problematic functions if they exist
DROP FUNCTION IF EXISTS call_sync_track();
DROP FUNCTION IF EXISTS notify_algolia();
DROP FUNCTION IF EXISTS notify_track_change();
DROP FUNCTION IF EXISTS notify_track_delete();

-- Recreate them with proper error handling
CREATE OR REPLACE FUNCTION call_sync_track()
RETURNS TRIGGER AS $$
BEGIN
  -- Only try to call net.http_post if the extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'net') THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://<your-project>.functions.supabase.co/sync-track',
        headers := json_build_object('Content-Type', 'application/json'),
        body := row_to_json(NEW)::text
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the insert
      RAISE WARNING 'net.http_post failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_algolia()
RETURNS TRIGGER AS $$
DECLARE
  payload json;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    payload := json_build_object('record', OLD, 'type', TG_OP);
  ELSE
    payload := json_build_object('record', NEW, 'type', TG_OP);
  END IF;

  -- Only try to call net.http_post if the extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'net') THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://yciqkebqlajqbpwlujma.functions.supabase.co/sync-to-algolia',
        headers := json_build_object('Content-Type', 'application/json'),
        body := payload::text
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the operation
      RAISE WARNING 'net.http_post failed: %', SQLERRM;
    END;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_track_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only try to call net.http_post if the extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'net') THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://yciqkebqlajqbpwlujma.supabase.co/functions/v1/sync-algolia-tracks',
        headers := json_build_object('Content-Type', 'application/json'),
        body := json_build_object('record', row_to_json(NEW), 'action', 'sync')
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the insert
      RAISE WARNING 'net.http_post failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_track_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only try to call net.http_post if the extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'net') THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://yciqkebqlajqbpwlujma.supabase.co/functions/v1/sync-algolia-tracks',
        headers := json_build_object('Content-Type', 'application/json'),
        body := json_build_object('record', row_to_json(OLD), 'action', 'delete')
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the delete
      RAISE WARNING 'net.http_post failed: %', SQLERRM;
    END;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Test if we can now insert into tracks
-- (This will be commented out to avoid actual insertion during debugging)
/*
INSERT INTO tracks (
    title, 
    artist, 
    track_producer_id,
    created_at,
    updated_at
) VALUES (
    'TEST_TRACK_FIX',
    'TEST_ARTIST',
    '83e21f94-aced-452a-bafb-6eb9629e3b18',
    NOW(),
    NOW()
);
*/
