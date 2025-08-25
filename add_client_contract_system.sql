-- Add Client Contract System for Sync Only and Custom Sync Requests
-- This migration adds the ability for clients to provide their own contracts instead of using the system's general agreement

-- 1. Add client contract preference to sync_proposals table
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS use_client_contract BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS client_contract_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS client_contract_url TEXT,
ADD COLUMN IF NOT EXISTS client_contract_filename TEXT,
ADD COLUMN IF NOT EXISTS client_contract_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_contract_signed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS client_contract_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_contract_signed_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS client_contract_signed_url TEXT,
ADD COLUMN IF NOT EXISTS client_contract_signed_filename TEXT,
ADD COLUMN IF NOT EXISTS client_contract_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS client_contract_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_contract_notes TEXT;

-- 2. Add client contract preference to custom_sync_requests table
ALTER TABLE custom_sync_requests 
ADD COLUMN IF NOT EXISTS use_client_contract BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS client_contract_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS client_contract_url TEXT,
ADD COLUMN IF NOT EXISTS client_contract_filename TEXT,
ADD COLUMN IF NOT EXISTS client_contract_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_contract_signed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS client_contract_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_contract_signed_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS client_contract_signed_url TEXT,
ADD COLUMN IF NOT EXISTS client_contract_signed_filename TEXT,
ADD COLUMN IF NOT EXISTS client_contract_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS client_contract_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_contract_notes TEXT;

-- 3. Create client_contracts table for better organization
CREATE TABLE IF NOT EXISTS client_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_proposal_id UUID REFERENCES sync_proposals(id) ON DELETE CASCADE,
  custom_sync_request_id UUID REFERENCES custom_sync_requests(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('sync_proposal', 'custom_sync_request')),
  original_contract_url TEXT NOT NULL,
  original_contract_filename TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  signed_contract_url TEXT,
  signed_contract_filename TEXT,
  signed_by UUID REFERENCES profiles(id),
  signed_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one reference is set
  CONSTRAINT client_contracts_single_reference CHECK (
    (sync_proposal_id IS NOT NULL AND custom_sync_request_id IS NULL) OR
    (sync_proposal_id IS NULL AND custom_sync_request_id IS NOT NULL)
  )
);

-- 4. Enable RLS on client_contracts table
ALTER TABLE client_contracts ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for client_contracts
-- Clients can view contracts for their sync proposals
CREATE POLICY "Clients can view their contract" ON client_contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sync_proposals sp
      WHERE sp.id = client_contracts.sync_proposal_id
      AND sp.client_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM custom_sync_requests csr
      WHERE csr.id = client_contracts.custom_sync_request_id
      AND csr.client_id = auth.uid()
    )
  );

-- Producers can view contracts for their tracks
CREATE POLICY "Producers can view contract for their tracks" ON client_contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sync_proposals sp
      JOIN tracks t ON sp.track_id = t.id
      WHERE sp.id = client_contracts.sync_proposal_id
      AND t.track_producer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM custom_sync_requests csr
      WHERE csr.id = client_contracts.custom_sync_request_id
      AND csr.selected_producer_id = auth.uid()
    )
  );

-- Clients can upload contracts
CREATE POLICY "Clients can upload contracts" ON client_contracts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sync_proposals sp
      WHERE sp.id = client_contracts.sync_proposal_id
      AND sp.client_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM custom_sync_requests csr
      WHERE csr.id = client_contracts.custom_sync_request_id
      AND csr.client_id = auth.uid()
    )
  );

-- Clients can update their contracts
CREATE POLICY "Clients can update their contracts" ON client_contracts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sync_proposals sp
      WHERE sp.id = client_contracts.sync_proposal_id
      AND sp.client_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM custom_sync_requests csr
      WHERE csr.id = client_contracts.custom_sync_request_id
      AND csr.client_id = auth.uid()
    )
  );

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_contracts_sync_proposal_id ON client_contracts(sync_proposal_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_custom_sync_request_id ON client_contracts(custom_sync_request_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_uploaded_by ON client_contracts(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_client_contracts_signed_by ON client_contracts(signed_by);

-- 7. Create updated_at trigger for client_contracts
CREATE TRIGGER update_client_contracts_updated_at
  BEFORE UPDATE ON client_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Create function to handle contract upload
CREATE OR REPLACE FUNCTION handle_client_contract_upload(
  p_sync_proposal_id UUID DEFAULT NULL,
  p_custom_sync_request_id UUID DEFAULT NULL,
  p_contract_url TEXT DEFAULT NULL,
  p_contract_filename TEXT DEFAULT NULL,
  p_uploaded_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_contract_id UUID;
  v_contract_type TEXT;
BEGIN
  -- Validate required parameters
  IF p_contract_url IS NULL OR p_contract_filename IS NULL OR p_uploaded_by IS NULL THEN
    RAISE EXCEPTION 'contract_url, contract_filename, and uploaded_by are required parameters';
  END IF;

  -- Determine contract type
  IF p_sync_proposal_id IS NOT NULL THEN
    v_contract_type := 'sync_proposal';
  ELSIF p_custom_sync_request_id IS NOT NULL THEN
    v_contract_type := 'custom_sync_request';
  ELSE
    RAISE EXCEPTION 'Either sync_proposal_id or custom_sync_request_id must be provided';
  END IF;

  -- Insert contract record
  INSERT INTO client_contracts (
    sync_proposal_id,
    custom_sync_request_id,
    contract_type,
    original_contract_url,
    original_contract_filename,
    uploaded_by
  ) VALUES (
    p_sync_proposal_id,
    p_custom_sync_request_id,
    v_contract_type,
    p_contract_url,
    p_contract_filename,
    p_uploaded_by
  ) RETURNING id INTO v_contract_id;

  -- Update the corresponding table
  IF p_sync_proposal_id IS NOT NULL THEN
    UPDATE sync_proposals 
    SET 
      client_contract_uploaded = TRUE,
      client_contract_url = p_contract_url,
      client_contract_filename = p_contract_filename,
      client_contract_uploaded_at = NOW()
    WHERE id = p_sync_proposal_id;
  ELSE
    UPDATE custom_sync_requests 
    SET 
      client_contract_uploaded = TRUE,
      client_contract_url = p_contract_url,
      client_contract_filename = p_contract_filename,
      client_contract_uploaded_at = NOW()
    WHERE id = p_custom_sync_request_id;
  END IF;

  RETURN v_contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to handle contract signing
CREATE OR REPLACE FUNCTION handle_client_contract_signing(
  p_contract_id UUID,
  p_signed_contract_url TEXT,
  p_signed_contract_filename TEXT,
  p_signed_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update contract record
  UPDATE client_contracts 
  SET 
    signed_contract_url = p_signed_contract_url,
    signed_contract_filename = p_signed_contract_filename,
    signed_by = p_signed_by,
    signed_at = NOW()
  WHERE id = p_contract_id;

  -- Update the corresponding table
  UPDATE sync_proposals 
  SET 
    client_contract_signed = TRUE,
    client_contract_signed_at = NOW(),
    client_contract_signed_by = p_signed_by,
    client_contract_signed_url = p_signed_contract_url,
    client_contract_signed_filename = p_signed_contract_filename
  WHERE id = (SELECT sync_proposal_id FROM client_contracts WHERE id = p_contract_id);

  UPDATE custom_sync_requests 
  SET 
    client_contract_signed = TRUE,
    client_contract_signed_at = NOW(),
    client_contract_signed_by = p_signed_by,
    client_contract_signed_url = p_signed_contract_url,
    client_contract_signed_filename = p_signed_contract_filename
  WHERE id = (SELECT custom_sync_request_id FROM client_contracts WHERE id = p_contract_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_client_contract_upload(UUID, UUID, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_client_contract_signing(UUID, TEXT, TEXT, UUID) TO authenticated;

-- 11. Add comments for documentation
COMMENT ON TABLE client_contracts IS 'Stores client-provided contracts for sync proposals and custom sync requests';
COMMENT ON COLUMN sync_proposals.use_client_contract IS 'Indicates if the client will provide their own contract instead of using the system agreement';
COMMENT ON COLUMN custom_sync_requests.use_client_contract IS 'Indicates if the client will provide their own contract instead of using the system agreement';
COMMENT ON FUNCTION handle_client_contract_upload IS 'Handles the upload of client contracts and updates related tables';
COMMENT ON FUNCTION handle_client_contract_signing IS 'Handles the signing of client contracts and updates related tables';

-- 12. Verify the changes
SELECT 'Client contract system added successfully!' as status;
