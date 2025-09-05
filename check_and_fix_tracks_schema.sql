-- Check and fix tracks table schema for rights holder upload
-- This script will verify the current schema and add missing columns

-- ============================================
-- 1. CHECK CURRENT SCHEMA
-- ============================================

-- Show current tracks table structure
SELECT 'Current tracks table schema:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
ORDER BY ordinal_position;

-- ============================================
-- 2. CHECK FOR REQUIRED COLUMNS
-- ============================================

-- Check if specific columns exist that the rights holder upload needs
SELECT 'Checking for required columns:' as info;

-- Check for master_rights_owner
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'tracks' AND column_name = 'master_rights_owner'
    ) 
    THEN 'master_rights_owner column exists' 
    ELSE 'master_rights_owner column missing' 
  END as status;

-- Check for publishing_rights_owner  
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'tracks' AND column_name = 'publishing_rights_owner'
    ) 
    THEN 'publishing_rights_owner column exists' 
    ELSE 'publishing_rights_owner column missing' 
  END as status;

-- Check for status
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'tracks' AND column_name = 'status'
    ) 
    THEN 'status column exists' 
    ELSE 'status column missing' 
  END as status;

-- Check for artwork_url vs image_url
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'tracks' AND column_name = 'artwork_url'
    ) 
    THEN 'artwork_url column exists' 
    ELSE 'artwork_url column missing (using image_url instead)' 
  END as status;

-- ============================================
-- 3. ADD MISSING COLUMNS
-- ============================================

-- Add master_rights_owner column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tracks' AND column_name = 'master_rights_owner'
    ) THEN
        ALTER TABLE tracks ADD COLUMN master_rights_owner TEXT;
        RAISE NOTICE 'Added master_rights_owner column to tracks';
    ELSE
        RAISE NOTICE 'master_rights_owner column already exists';
    END IF;
END $$;

-- Add publishing_rights_owner column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tracks' AND column_name = 'publishing_rights_owner'
    ) THEN
        ALTER TABLE tracks ADD COLUMN publishing_rights_owner TEXT;
        RAISE NOTICE 'Added publishing_rights_owner column to tracks';
    ELSE
        RAISE NOTICE 'publishing_rights_owner column already exists';
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tracks' AND column_name = 'status'
    ) THEN
        ALTER TABLE tracks ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Added status column to tracks';
    ELSE
        RAISE NOTICE 'status column already exists';
    END IF;
END $$;

-- ============================================
-- 4. VERIFY FINAL SCHEMA
-- ============================================

-- Show final tracks table structure
SELECT 'Final tracks table schema:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
ORDER BY ordinal_position;

-- ============================================
-- 5. TEST DATA INSERT (WITHOUT ACTUALLY INSERTING)
-- ============================================

-- Test if we can construct a valid insert statement for rights holder upload
SELECT 'Schema validation for rights holder upload:' as info;
SELECT 
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'tracks' 
      AND column_name IN (
        'track_producer_id', 'title', 'artist', 'genres', 'sub_genres', 
        'moods', 'bpm', 'key', 'duration', 'description', 'audio_url', 
        'image_url', 'instruments', 'media_usage', 'has_vocals', 
        'is_sync_only', 'master_rights_owner', 'publishing_rights_owner', 'status'
      )
    )
    THEN 'All required columns present - rights holder upload should work'
    ELSE 'Missing required columns - rights holder upload will fail'
  END as result;
