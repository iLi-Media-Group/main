DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'white_label_clients_owner_id_fkey'
  ) THEN
    ALTER TABLE white_label_clients
    ADD CONSTRAINT white_label_clients_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES profiles(id);
  END IF;
END $$; 