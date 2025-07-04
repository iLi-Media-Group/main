-- Create white_label_clients table
CREATE TABLE IF NOT EXISTS white_label_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE white_label_clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all white label clients" ON white_label_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
    )
  );

CREATE POLICY "White label clients can view their own data" ON white_label_clients
  FOR SELECT USING (owner_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_white_label_clients_owner_id ON white_label_clients(owner_id);

-- Add some sample data for testing
INSERT INTO white_label_clients (display_name, owner_id, domain, logo_url) VALUES
  ('Sample White Label Client', '83e21f94-aced-452a-bafb-6eb9629e3b18', 'sample.example.com', 'https://example.com/logo.png')
ON CONFLICT DO NOTHING; 