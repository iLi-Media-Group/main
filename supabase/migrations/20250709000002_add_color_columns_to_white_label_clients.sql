-- Migration: Add color columns to white_label_clients
ALTER TABLE white_label_clients
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#8b5cf6';

-- Add comments for the color columns
COMMENT ON COLUMN white_label_clients.primary_color IS 'Primary brand color for the white label client';
COMMENT ON COLUMN white_label_clients.secondary_color IS 'Secondary brand color for the white label client'; 