-- Fix media_usage column in tracks table
-- This script checks if media_usage column exists and adds it if missing

-- Check if media_usage column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tracks' 
        AND column_name = 'media_usage'
    ) THEN
        -- Add media_usage column as TEXT[] array
        ALTER TABLE tracks ADD COLUMN media_usage TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added media_usage column to tracks table';
    ELSE
        RAISE NOTICE 'media_usage column already exists in tracks table';
    END IF;
END $$;

-- Check the data type of media_usage column
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'ARRAY' THEN '✅ Correct array type'
        WHEN data_type = 'text' THEN '❌ Should be TEXT[] not TEXT - needs to be converted'
        ELSE 'ℹ️ ' || data_type
    END as status
FROM information_schema.columns 
WHERE table_name = 'tracks' 
AND column_name = 'media_usage';

-- If media_usage exists but is TEXT instead of TEXT[], convert it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tracks' 
        AND column_name = 'media_usage'
        AND data_type = 'text'
    ) THEN
        -- Convert TEXT column to TEXT[] array
        ALTER TABLE tracks ALTER COLUMN media_usage TYPE TEXT[] USING ARRAY[media_usage];
        RAISE NOTICE 'Converted media_usage column from TEXT to TEXT[]';
    END IF;
END $$;

-- Verify the final state
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
AND column_name = 'media_usage';
