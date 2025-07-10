-- Migration: Add revenue and features columns to white_label_clients
ALTER TABLE white_label_clients
ADD COLUMN setup_amount_paid numeric,
ADD COLUMN features_purchased jsonb,
ADD COLUMN features_amount_paid numeric; 