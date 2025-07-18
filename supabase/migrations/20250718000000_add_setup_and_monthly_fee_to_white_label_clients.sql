-- Migration: Add setup_fee and monthly_fee columns to white_label_clients
ALTER TABLE white_label_clients
  ADD COLUMN IF NOT EXISTS setup_fee numeric(10,2),
  ADD COLUMN IF NOT EXISTS monthly_fee numeric(10,2);

-- Optionally, add comments for documentation
COMMENT ON COLUMN white_label_clients.setup_fee IS 'One-time setup fee charged to the white label client';
COMMENT ON COLUMN white_label_clients.monthly_fee IS 'Monthly subscription fee for the white label client'; 