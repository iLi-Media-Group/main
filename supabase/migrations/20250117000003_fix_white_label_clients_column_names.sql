-- Migration: Fix white_label_clients table column names
-- This ensures consistency between display_name and company_name columns

-- First, check if company_name column exists and has NOT NULL constraint
DO $$
BEGIN
  -- If company_name column exists and display_name doesn't, rename company_name to display_name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'white_label_clients' 
    AND column_name = 'company_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'white_label_clients' 
    AND column_name = 'display_name'
  ) THEN
    -- Rename company_name to display_name
    ALTER TABLE white_label_clients RENAME COLUMN company_name TO display_name;
  END IF;
  
  -- If both columns exist, drop company_name and keep display_name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'white_label_clients' 
    AND column_name = 'company_name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'white_label_clients' 
    AND column_name = 'display_name'
  ) THEN
    -- Drop the company_name column since we're using display_name
    ALTER TABLE white_label_clients DROP COLUMN company_name;
  END IF;
END $$;

-- Ensure display_name column exists and has proper constraints
ALTER TABLE white_label_clients ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Make display_name NOT NULL if it doesn't have the constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'white_label_clients' 
    AND column_name = 'display_name' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE white_label_clients ALTER COLUMN display_name SET NOT NULL;
  END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN white_label_clients.display_name IS 'Display name for the white label client'; 