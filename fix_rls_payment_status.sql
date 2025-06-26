-- Fix RLS policy to ensure clients can see updated payment_status
-- This addresses the issue where database shows payment_status = 'paid' 
-- but frontend query returns payment_status = 'pending'

-- Drop existing client view policy
DROP POLICY IF EXISTS "Clients can view their own proposals" ON sync_proposals;

-- Create updated client view policy that explicitly allows all columns
CREATE POLICY "Clients can view their own proposals" 
ON sync_proposals 
FOR SELECT 
TO public 
USING (auth.uid() = client_id);

-- Also ensure the client update policy allows payment_status updates
DROP POLICY IF EXISTS "Clients can update their own proposals" ON sync_proposals;

CREATE POLICY "Clients can update their own proposals" 
ON sync_proposals 
FOR UPDATE 
TO public 
USING (auth.uid() = client_id)
WITH CHECK (
  (auth.uid() = client_id) AND 
  (
    (status = 'pending') OR 
    (status = 'producer_accepted') OR
    (status = 'accepted' AND client_status IN ('pending', 'accepted', 'rejected'))
  )
);

-- Verify the policies are working
-- This query should return the same data as the frontend query
SELECT 
  id, 
  status, 
  client_status, 
  payment_status, 
  sync_fee,
  created_at,
  updated_at
FROM sync_proposals 
WHERE client_id = auth.uid()
  AND id IN ('7af40356-66f3-45d7-87f3-710dff65b46a', '6b2c0641-bae3-4fdb-a43a-e3b0de12b71b')
ORDER BY updated_at DESC; 