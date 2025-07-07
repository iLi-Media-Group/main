-- Migration: Fix white_label_clients table owner_email column
-- This migration ensures the owner_email column exists and has proper constraints

-- Add owner_email column if it doesn't exist
ALTER TABLE white_label_clients ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- Add comment to document the purpose
COMMENT ON COLUMN white_label_clients.owner_email IS 'Email address of the white label client owner for reference';

-- Create index for efficient querying by owner email
CREATE INDEX IF NOT EXISTS idx_white_label_clients_owner_email 
ON white_label_clients(owner_email) 
WHERE owner_email IS NOT NULL;

-- Update RLS policies to allow admins to insert white label clients
DROP POLICY IF EXISTS "Admins can insert white label clients" ON white_label_clients;
CREATE POLICY "Admins can insert white label clients" ON white_label_clients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- Update RLS policies to allow admins to update white label clients
DROP POLICY IF EXISTS "Admins can update white label clients" ON white_label_clients;
CREATE POLICY "Admins can update white label clients" ON white_label_clients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- Update RLS policies to allow admins to delete white label clients
DROP POLICY IF EXISTS "Admins can delete white label clients" ON white_label_clients;
CREATE POLICY "Admins can delete white label clients" ON white_label_clients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    )
  ); 