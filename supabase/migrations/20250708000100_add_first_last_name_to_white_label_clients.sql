-- Migration: Add first_name and last_name columns to white_label_clients
ALTER TABLE white_label_clients
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT; 