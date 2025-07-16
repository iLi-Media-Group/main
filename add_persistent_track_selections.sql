-- Add persistent track selections table
CREATE TABLE IF NOT EXISTS sync_request_selections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_request_id UUID NOT NULL REFERENCES custom_sync_requests(id) ON DELETE CASCADE,
  selected_submission_id UUID NOT NULL REFERENCES sync_submissions(id) ON DELETE CASCADE,
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, sync_request_id)
);

-- Add RLS policies
ALTER TABLE sync_request_selections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own selections
CREATE POLICY "Users can view their own selections" ON sync_request_selections
  FOR SELECT USING (auth.uid() = client_id);

-- Policy: Users can insert their own selections
CREATE POLICY "Users can insert their own selections" ON sync_request_selections
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Policy: Users can update their own selections
CREATE POLICY "Users can update their own selections" ON sync_request_selections
  FOR UPDATE USING (auth.uid() = client_id);

-- Policy: Users can delete their own selections
CREATE POLICY "Users can delete their own selections" ON sync_request_selections
  FOR DELETE USING (auth.uid() = client_id);

-- Add comments
COMMENT ON TABLE sync_request_selections IS 'Stores persistent track selections for custom sync requests';
COMMENT ON COLUMN sync_request_selections.client_id IS 'The client who made the selection';
COMMENT ON COLUMN sync_request_selections.sync_request_id IS 'The sync request the selection is for';
COMMENT ON COLUMN sync_request_selections.selected_submission_id IS 'The selected submission/track';
COMMENT ON COLUMN sync_request_selections.selected_at IS 'When the selection was made'; 