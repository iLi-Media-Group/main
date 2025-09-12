-- Add missing image columns to services table
-- This script adds image2 and image3 columns that are needed for the services upload modal

-- Check if columns exist first
DO $$
BEGIN
    -- Add image2 column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'image2'
    ) THEN
        ALTER TABLE services ADD COLUMN image2 text;
        RAISE NOTICE 'Added image2 column to services table';
    ELSE
        RAISE NOTICE 'image2 column already exists in services table';
    END IF;

    -- Add image3 column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'image3'
    ) THEN
        ALTER TABLE services ADD COLUMN image3 text;
        RAISE NOTICE 'Added image3 column to services table';
    ELSE
        RAISE NOTICE 'image3 column already exists in services table';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'services' 
AND column_name IN ('image', 'image2', 'image3')
ORDER BY column_name;

-- Show current services table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'services' 
ORDER BY ordinal_position;
