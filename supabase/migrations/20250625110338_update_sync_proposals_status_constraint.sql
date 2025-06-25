-- Update status check constraint for sync_proposals to allow new statuses
ALTER TABLE sync_proposals
  DROP CONSTRAINT IF EXISTS sync_proposals_status_check;
ALTER TABLE sync_proposals
  ADD CONSTRAINT sync_proposals_status_check
    CHECK (status IN (
      'pending',
      'pending_client',
      'client_accepted',
      'producer_accepted',
      'accepted',
      'rejected',
      'expired'
    )); 