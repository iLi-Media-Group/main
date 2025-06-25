-- Add RLS policies for producers to manage sync_proposals for their tracks

-- Enable RLS on sync_proposals if not already enabled
ALTER TABLE sync_proposals ENABLE ROW LEVEL SECURITY;

-- Drop existing producer policies if they exist
DROP POLICY IF EXISTS "Producers can view proposals for their tracks" ON sync_proposals;
DROP POLICY IF EXISTS "Producers can update proposals for their tracks" ON sync_proposals;

-- Create policy for producers to view sync_proposals for their tracks
CREATE POLICY "Producers can view proposals for their tracks" 
ON sync_proposals 
FOR SELECT 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM tracks 
    WHERE tracks.id = sync_proposals.track_id 
    AND tracks.producer_id = auth.uid()
  )
);

-- Create policy for producers to update sync_proposals for their tracks
CREATE POLICY "Producers can update proposals for their tracks" 
ON sync_proposals 
FOR UPDATE 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM tracks 
    WHERE tracks.id = sync_proposals.track_id 
    AND tracks.producer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tracks 
    WHERE tracks.id = sync_proposals.track_id 
    AND tracks.producer_id = auth.uid()
  )
); 