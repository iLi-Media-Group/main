-- Migration: Add missing image columns to services table
-- This migration adds image2 and image3 columns that are needed for the services upload modal

-- Add image2 column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'image2'
    ) THEN
        ALTER TABLE services ADD COLUMN image2 text;
    END IF;
END $$;

-- Add image3 column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'image3'
    ) THEN
        ALTER TABLE services ADD COLUMN image3 text;
    END IF;
END $$;
