-- Trigger to auto-accept sync proposals if both parties have accepted and payment is made
CREATE OR REPLACE FUNCTION auto_accept_sync_proposal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_status = 'accepted'
     AND NEW.producer_status = 'accepted'
     AND NEW.payment_status = 'paid'
     AND (NEW.status IS DISTINCT FROM 'accepted' OR NEW.negotiation_status IS DISTINCT FROM 'accepted') THEN
    UPDATE sync_proposals
    SET status = 'accepted',
        negotiation_status = 'accepted',
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_accept_sync_proposal ON sync_proposals;
CREATE TRIGGER trg_auto_accept_sync_proposal
AFTER UPDATE ON sync_proposals
FOR EACH ROW
EXECUTE FUNCTION auto_accept_sync_proposal(); 