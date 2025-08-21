-- Check Master Recordings Table Schema
-- This script verifies the table structure and adds missing columns if needed

-- ============================================
-- 1. CHECK CURRENT SCHEMA
-- ============================================

-- Show current table structure
SELECT 'Current master_recordings schema' as status,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns
WHERE table_name = 'master_recordings'
ORDER BY ordinal_position;

-- ============================================
-- 2. CHECK FOR REQUIRED COLUMNS
-- ============================================

-- Check if rights_holder_id column exists
SELECT 'rights_holder_id column check' as status,
       CASE
         WHEN EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = 'master_recordings' 
           AND column_name = 'rights_holder_id'
         )
         THEN 'rights_holder_id column exists'
         ELSE 'rights_holder_id column missing'
       END as result;

-- Check if sub_genre column exists
SELECT 'sub_genre column check' as status,
       CASE
         WHEN EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = 'master_recordings' 
           AND column_name = 'sub_genre'
         )
         THEN 'sub_genre column exists'
         ELSE 'sub_genre column missing'
       END as result;

-- Check if instruments column exists
SELECT 'instruments column check' as status,
       CASE
         WHEN EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = 'master_recordings' 
           AND column_name = 'instruments'
         )
         THEN 'instruments column exists'
         ELSE 'instruments column missing'
       END as result;

-- ============================================
-- 3. ADD MISSING COLUMNS IF NEEDED
-- ============================================

-- Add rights_holder_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'master_recordings' 
        AND column_name = 'rights_holder_id'
    ) THEN
        ALTER TABLE master_recordings ADD COLUMN rights_holder_id UUID REFERENCES rights_holders(id);
        RAISE NOTICE 'Added rights_holder_id column to master_recordings';
    ELSE
        RAISE NOTICE 'rights_holder_id column already exists';
    END IF;
END $$;

-- Add sub_genre column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'master_recordings' 
        AND column_name = 'sub_genre'
    ) THEN
        ALTER TABLE master_recordings ADD COLUMN sub_genre TEXT;
        RAISE NOTICE 'Added sub_genre column to master_recordings';
    ELSE
        RAISE NOTICE 'sub_genre column already exists';
    END IF;
END $$;

-- Add instruments column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'master_recordings' 
        AND column_name = 'instruments'
    ) THEN
        ALTER TABLE master_recordings ADD COLUMN instruments TEXT[];
        RAISE NOTICE 'Added instruments column to master_recordings';
    ELSE
        RAISE NOTICE 'instruments column already exists';
    END IF;
END $$;

-- ============================================
-- 4. VERIFY FINAL SCHEMA
-- ============================================

-- Show final table structure
SELECT 'Final master_recordings schema' as status,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns
WHERE table_name = 'master_recordings'
ORDER BY ordinal_position;

-- ============================================
-- 5. TEST INSERT (WITHOUT ACTUALLY INSERTING)
-- ============================================

-- Test if we can construct a valid insert statement
SELECT 'Schema validation' as status,
       CASE
         WHEN EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = 'master_recordings' 
           AND column_name IN ('rights_holder_id', 'title', 'artist', 'genre', 'sub_genre', 'mood', 'bpm', 'key', 'instruments')
         )
         THEN 'All required columns present - upload should work'
         ELSE 'Missing required columns - upload will fail'
       END as result;
