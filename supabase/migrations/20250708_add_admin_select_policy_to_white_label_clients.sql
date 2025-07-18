-- Enable RLS if not already enabled
ALTER TABLE white_label_clients ENABLE ROW LEVEL SECURITY;

-- Allow only site admins (account_type = 'admin') to select from white_label_clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all white label clients' AND tablename = 'white_label_clients'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can view all white label clients" ON white_label_clients
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND account_type = 'admin'
          )
        )
    $policy$;
  END IF;
END $$; 