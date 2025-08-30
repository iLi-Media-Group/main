-- Fix instruments column in tracks table
-- This script checks if instruments column exists and adds it if missing

-- Check if instruments column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tracks' 
        AND column_name = 'instruments'
    ) THEN
        -- Add instruments column as TEXT[] array
        ALTER TABLE tracks ADD COLUMN instruments TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added instruments column to tracks table';
    ELSE
        RAISE NOTICE 'instruments column already exists in tracks table';
    END IF;
END $$;

-- Check the data type of instruments column
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
AND column_name = 'instruments';

-- If instruments exists but is TEXT instead of TEXT[], convert it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tracks' 
        AND column_name = 'instruments'
        AND data_type = 'text'
    ) THEN
        -- Convert TEXT column to TEXT[] array
        ALTER TABLE tracks ALTER COLUMN instruments TYPE TEXT[] USING ARRAY[instruments];
        RAISE NOTICE 'Converted instruments column from TEXT to TEXT[]';
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
AND column_name = 'instruments';
