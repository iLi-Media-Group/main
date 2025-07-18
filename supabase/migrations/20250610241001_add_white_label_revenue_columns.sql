-- Migration: Add revenue and features columns to white_label_clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='white_label_clients' AND column_name='setup_amount_paid'
  ) THEN
    ALTER TABLE white_label_clients ADD COLUMN setup_amount_paid numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='white_label_clients' AND column_name='features_purchased'
  ) THEN
    ALTER TABLE white_label_clients ADD COLUMN features_purchased jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='white_label_clients' AND column_name='features_amount_paid'
  ) THEN
    ALTER TABLE white_label_clients ADD COLUMN features_amount_paid numeric;
  END IF;
END $$; 