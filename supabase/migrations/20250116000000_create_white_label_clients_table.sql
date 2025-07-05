-- Migration: Create white_label_clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS white_label_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT,
  domain TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add display_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'white_label_clients' 
    AND column_name = 'display_name'
  ) THEN
    ALTER TABLE white_label_clients ADD COLUMN display_name TEXT;
  END IF;
END $$;

-- Create index on owner_id for better performance
CREATE INDEX IF NOT EXISTS idx_white_label_clients_owner_id ON white_label_clients(owner_id);

-- Enable RLS
ALTER TABLE white_label_clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop if exists first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own white label client" ON white_label_clients;
CREATE POLICY "Users can view their own white label client" ON white_label_clients
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own white label client" ON white_label_clients;
CREATE POLICY "Users can insert their own white label client" ON white_label_clients
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own white label client" ON white_label_clients;
CREATE POLICY "Users can update their own white label client" ON white_label_clients
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own white label client" ON white_label_clients;
CREATE POLICY "Users can delete their own white label client" ON white_label_clients
  FOR DELETE USING (auth.uid() = owner_id);

-- Admin can view all white label clients
DROP POLICY IF EXISTS "Admins can view all white label clients" ON white_label_clients;
CREATE POLICY "Admins can view all white label clients" ON white_label_clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    )
  ); 