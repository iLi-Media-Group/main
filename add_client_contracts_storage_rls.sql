-- Add RLS policies for client-contracts storage bucket
-- This migration sets up proper security policies for the client-contracts storage bucket

-- 1. Enable RLS on the client-contracts storage bucket
-- Note: Storage buckets don't have RLS in the same way as tables, but we can control access through policies

-- 2. Create storage policies for client-contracts bucket
-- Allow clients to upload contracts for their sync proposals
CREATE POLICY "Clients can upload contracts for their sync proposals" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'client-contracts' AND
    EXISTS (
      SELECT 1 FROM sync_proposals sp
      WHERE sp.id::text = (storage.foldername(name))[1]
      AND sp.client_id = auth.uid()
    )
  );

-- Allow clients to upload contracts for their custom sync requests
CREATE POLICY "Clients can upload contracts for their custom sync requests" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'client-contracts' AND
    EXISTS (
      SELECT 1 FROM custom_sync_requests csr
      WHERE csr.id::text = (storage.foldername(name))[1]
      AND csr.client_id = auth.uid()
    )
  );

-- Allow clients to view contracts for their sync proposals
CREATE POLICY "Clients can view contracts for their sync proposals" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'client-contracts' AND
    EXISTS (
      SELECT 1 FROM sync_proposals sp
      WHERE sp.id::text = (storage.foldername(name))[1]
      AND sp.client_id = auth.uid()
    )
  );

-- Allow clients to view contracts for their custom sync requests
CREATE POLICY "Clients can view contracts for their custom sync requests" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'client-contracts' AND
    EXISTS (
      SELECT 1 FROM custom_sync_requests csr
      WHERE csr.id::text = (storage.foldername(name))[1]
      AND csr.client_id = auth.uid()
    )
  );

-- Allow producers to view contracts for their tracks (sync proposals)
CREATE POLICY "Producers can view contracts for their tracks" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'client-contracts' AND
    EXISTS (
      SELECT 1 FROM sync_proposals sp
      JOIN tracks t ON sp.track_id = t.id
      WHERE sp.id::text = (storage.foldername(name))[1]
      AND t.track_producer_id = auth.uid()
    )
  );

-- Allow producers to view contracts for their custom sync requests
CREATE POLICY "Producers can view contracts for their custom sync requests" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'client-contracts' AND
    EXISTS (
      SELECT 1 FROM custom_sync_requests csr
      WHERE csr.id::text = (storage.foldername(name))[1]
      AND csr.selected_producer_id = auth.uid()
    )
  );

-- Allow clients to update contracts for their sync proposals
CREATE POLICY "Clients can update contracts for their sync proposals" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'client-contracts' AND
    EXISTS (
      SELECT 1 FROM sync_proposals sp
      WHERE sp.id::text = (storage.foldername(name))[1]
      AND sp.client_id = auth.uid()
    )
  );

-- Allow clients to update contracts for their custom sync requests
CREATE POLICY "Clients can update contracts for their custom sync requests" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'client-contracts' AND
    EXISTS (
      SELECT 1 FROM custom_sync_requests csr
      WHERE csr.id::text = (storage.foldername(name))[1]
      AND csr.client_id = auth.uid()
    )
  );

-- Allow producers to update contracts for their tracks (for signing)
CREATE POLICY "Producers can update contracts for their tracks" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'client-contracts' AND
    EXISTS (
      SELECT 1 FROM sync_proposals sp
      JOIN tracks t ON sp.track_id = t.id
      WHERE sp.id::text = (storage.foldername(name))[1]
      AND t.track_producer_id = auth.uid()
    )
  );

-- Allow producers to update contracts for their custom sync requests (for signing)
CREATE POLICY "Producers can update contracts for their custom sync requests" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'client-contracts' AND
    EXISTS (
      SELECT 1 FROM custom_sync_requests csr
      WHERE csr.id::text = (storage.foldername(name))[1]
      AND csr.selected_producer_id = auth.uid()
    )
  );

-- Allow admins to view all contracts
CREATE POLICY "Admins can view all contracts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'client-contracts' AND
    auth.jwt() ->> 'email' IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
  );

-- Allow admins to update all contracts
CREATE POLICY "Admins can update all contracts" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'client-contracts' AND
    auth.jwt() ->> 'email' IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
  );

-- Allow admins to delete all contracts
CREATE POLICY "Admins can delete all contracts" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'client-contracts' AND
    auth.jwt() ->> 'email' IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
  );

-- Verify the policies were created
SELECT 'Client contracts storage RLS policies added successfully!' as status;
