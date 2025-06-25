-- Update status check constraint for proposal_history to allow all workflow statuses
ALTER TABLE proposal_history
  DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE proposal_history
  ADD CONSTRAINT valid_status CHECK (
    new_status IN (
      'pending',
      'pending_client',
      'client_accepted',
      'producer_accepted',
      'accepted',
      'rejected',
      'expired'
    )
  ); 