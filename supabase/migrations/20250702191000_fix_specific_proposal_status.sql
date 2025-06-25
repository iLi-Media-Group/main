-- Fix the specific proposal status that was mentioned
-- Update proposal 7af40356-66f3-45d7-87f3-710dff65b46a from 'pending' to 'producer_accepted'

UPDATE sync_proposals 
SET 
  status = 'producer_accepted',
  updated_at = NOW()
WHERE id = '7af40356-66f3-45d7-87f3-710dff65b46a';

-- Also add a history entry to record this change
INSERT INTO proposal_history (
  proposal_id,
  previous_status,
  new_status,
  changed_by,
  created_at
) 
SELECT 
  '7af40356-66f3-45d7-87f3-710dff65b46a',
  'pending',
  'producer_accepted',
  tracks.producer_id,
  NOW()
FROM tracks 
JOIN sync_proposals ON tracks.id = sync_proposals.track_id
WHERE sync_proposals.id = '7af40356-66f3-45d7-87f3-710dff65b46a'; 