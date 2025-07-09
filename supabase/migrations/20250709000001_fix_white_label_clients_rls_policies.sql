-- Migration: Fix RLS policies for white_label_clients to allow users to create their own records
-- Enable RLS if not already enabled
ALTER TABLE white_label_clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert white label clients" ON white_label_clients;
DROP POLICY IF EXISTS "Admins can update white label clients" ON white_label_clients;
DROP POLICY IF EXISTS "Admins can delete white label clients" ON white_label_clients;

-- Create new policies that allow users to manage their own white label clients
CREATE POLICY "Users can insert their own white label clients" ON white_label_clients
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    )
  );

CREATE POLICY "Users can update their own white label clients" ON white_label_clients
  FOR UPDATE USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    )
  );

CREATE POLICY "Users can view their own white label clients" ON white_label_clients
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete white label clients" ON white_label_clients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    )
  ); 