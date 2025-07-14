-- Updated handle_negotiation_acceptance function for correct sync proposal flow
-- Ensures correct status, negotiation_status, and payment_status transitions

CREATE OR REPLACE FUNCTION handle_negotiation_acceptance(
  proposal_id uuid,
  is_sync_proposal boolean DEFAULT true
) RETURNS void AS $$
DECLARE
  acceptance_date timestamptz := NOW();
  proposal_record record;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF is_sync_proposal THEN
    -- Get proposal details
    SELECT * INTO proposal_record FROM sync_proposals WHERE id = proposal_id;
    
    -- Check if current user is the client
    IF current_user_id = proposal_record.client_id THEN
      -- Client is accepting - update client status
      UPDATE sync_proposals 
      SET 
        client_status = 'accepted',
        client_accepted_at = acceptance_date,
        final_amount = COALESCE(proposal_record.negotiated_amount, proposal_record.sync_fee),
        final_payment_terms = COALESCE(proposal_record.negotiated_payment_terms, proposal_record.payment_terms),
        updated_at = acceptance_date
      WHERE id = proposal_id;
      
      -- Check if producer has already accepted
      IF proposal_record.producer_status = 'accepted' THEN
        -- Both parties have accepted - set final acceptance, move to payment pending
        UPDATE sync_proposals 
        SET 
          status = 'accepted',
          negotiation_status = 'accepted',
          payment_due_date = calculate_payment_due_date(acceptance_date, COALESCE(proposal_record.negotiated_payment_terms, proposal_record.payment_terms)),
          payment_status = 'pending',
          updated_at = acceptance_date
        WHERE id = proposal_id;
      ELSE
        -- Producer hasn't accepted yet - set status to pending producer acceptance
        UPDATE sync_proposals 
        SET 
          status = 'pending_producer',
          negotiation_status = 'client_accepted',
          updated_at = acceptance_date
        WHERE id = proposal_id;
      END IF;
      
    ELSE
      -- Producer is accepting - update producer status
      UPDATE sync_proposals 
      SET 
        producer_status = 'accepted',
        updated_at = acceptance_date
      WHERE id = proposal_id;
      
      -- Check if client has already accepted
      IF proposal_record.client_status = 'accepted' THEN
        -- Both parties have accepted - set final acceptance, move to payment pending
        UPDATE sync_proposals 
        SET 
          status = 'accepted',
          negotiation_status = 'accepted',
          payment_due_date = calculate_payment_due_date(acceptance_date, COALESCE(proposal_record.negotiated_payment_terms, proposal_record.payment_terms)),
          payment_status = 'pending',
          updated_at = acceptance_date
        WHERE id = proposal_id;
      ELSE
        -- Client hasn't accepted yet - set status to pending client acceptance
        UPDATE sync_proposals 
        SET 
          status = 'pending_client',
          negotiation_status = 'producer_accepted',
          updated_at = acceptance_date
        WHERE id = proposal_id;
      END IF;
    END IF;
    
  ELSE
    -- Handle custom sync requests (simplified for now)
    UPDATE custom_sync_requests 
    SET 
      negotiation_status = 'accepted',
      client_accepted_at = acceptance_date,
      final_amount = COALESCE(negotiated_amount, sync_fee),
      final_payment_terms = COALESCE(negotiated_payment_terms, payment_terms),
      payment_due_date = calculate_payment_due_date(acceptance_date, COALESCE(negotiated_payment_terms, payment_terms)),
      updated_at = acceptance_date
    WHERE id = proposal_id;
  END IF;
END;
$$ LANGUAGE plpgsql; 