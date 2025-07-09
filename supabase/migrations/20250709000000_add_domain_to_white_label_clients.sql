-- Migration: Add domain column to white_label_clients
ALTER TABLE white_label_clients
  ADD COLUMN IF NOT EXISTS domain TEXT;

-- Add comment for the domain column
COMMENT ON COLUMN white_label_clients.domain IS 'Custom domain for the white label client'; 