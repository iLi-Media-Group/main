-- Migration: Add first_name and last_name columns to white_label_clients table
-- This allows storing the owner's first and last name directly in the white_label_clients table

-- Add first_name column
ALTER TABLE white_label_clients 
ADD COLUMN IF NOT EXISTS first_name TEXT;

-- Add last_name column  
ALTER TABLE white_label_clients 
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN white_label_clients.first_name IS 'First name of the white label client owner';
COMMENT ON COLUMN white_label_clients.last_name IS 'Last name of the white label client owner';

-- Create index for efficient querying by name
CREATE INDEX IF NOT EXISTS idx_white_label_clients_name 
ON white_label_clients(first_name, last_name) 
WHERE first_name IS NOT NULL OR last_name IS NOT NULL; 