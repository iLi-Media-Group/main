-- Simple fix for net.http_post issue
-- This script will drop all dependencies and recreate the functions with proper error handling

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

-- Drop the problematic functions with CASCADE to handle all dependencies
DROP FUNCTION IF EXISTS call_sync_track() CASCADE;
DROP FUNCTION IF EXISTS notify_algolia() CASCADE;
DROP FUNCTION IF EXISTS notify_track_change() CASCADE;
DROP FUNCTION IF EXISTS notify_track_delete() CASCADE;

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

-- Now recreate the triggers with the fixed functions
-- Using the actual trigger names we discovered
CREATE TRIGGER trigger_sync_track
    AFTER INSERT ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION call_sync_track();

CREATE TRIGGER trigger_algolia
    AFTER INSERT OR UPDATE OR DELETE ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION notify_algolia();

CREATE TRIGGER on_track_insert
    AFTER INSERT ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION notify_track_change();

CREATE TRIGGER on_track_update
    AFTER UPDATE ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION notify_track_change();

CREATE TRIGGER trigger_notify_track_delete
    AFTER DELETE ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION notify_track_delete();

-- Verify the triggers were recreated
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'tracks'
ORDER BY trigger_name;
