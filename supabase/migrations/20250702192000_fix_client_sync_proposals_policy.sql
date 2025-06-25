-- Fix client update policy for sync_proposals to allow updates when status is 'producer_accepted'

-- Drop the existing client update policy
DROP POLICY IF EXISTS "Clients can update their own proposals" ON sync_proposals;

-- Create updated client update policy that allows updates when status is 'producer_accepted'
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