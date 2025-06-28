-- Migration: Add negotiation acceptance fields for sync proposals and custom sync requests
-- This enables proper negotiation flow with client acceptance of counter-offers

-- Add negotiation acceptance fields to sync_proposals
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS negotiated_amount numeric,
ADD COLUMN IF NOT EXISTS negotiated_payment_terms text CHECK (negotiated_payment_terms IN ('immediate', 'net30', 'net60', 'net90')),
ADD COLUMN IF NOT EXISTS negotiation_status text DEFAULT 'pending' CHECK (negotiation_status IN ('pending', 'negotiating', 'client_acceptance_required', 'accepted', 'rejected')),
ADD COLUMN IF NOT EXISTS final_amount numeric,
ADD COLUMN IF NOT EXISTS final_payment_terms text CHECK (final_payment_terms IN ('immediate', 'net30', 'net60', 'net90')),
ADD COLUMN IF NOT EXISTS client_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS payment_due_date timestamptz,
ADD COLUMN IF NOT EXISTS invoice_created_at timestamptz;

-- Add negotiation acceptance fields to custom_sync_requests
ALTER TABLE custom_sync_requests 
ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT 'immediate' CHECK (payment_terms IN ('immediate', 'net30', 'net60', 'net90')),
ADD COLUMN IF NOT EXISTS negotiated_amount numeric,
ADD COLUMN IF NOT EXISTS negotiated_payment_terms text CHECK (negotiated_payment_terms IN ('immediate', 'net30', 'net60', 'net90')),
ADD COLUMN IF NOT EXISTS negotiation_status text DEFAULT 'pending' CHECK (negotiation_status IN ('pending', 'negotiating', 'client_acceptance_required', 'accepted', 'rejected')),
ADD COLUMN IF NOT EXISTS final_amount numeric,
ADD COLUMN IF NOT EXISTS final_payment_terms text CHECK (final_payment_terms IN ('immediate', 'net30', 'net60', 'net90')),
ADD COLUMN IF NOT EXISTS client_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS payment_due_date timestamptz,
ADD COLUMN IF NOT EXISTS invoice_created_at timestamptz,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
ADD COLUMN IF NOT EXISTS stripe_invoice_id text;

-- Create function to calculate payment due date
CREATE OR REPLACE FUNCTION calculate_payment_due_date(
  acceptance_date timestamptz,
  payment_terms text
) RETURNS timestamptz AS $$
BEGIN
  CASE payment_terms
    WHEN 'net30' THEN
      RETURN acceptance_date + INTERVAL '30 days';
    WHEN 'net60' THEN
      RETURN acceptance_date + INTERVAL '60 days';
    WHEN 'net90' THEN
      RETURN acceptance_date + INTERVAL '90 days';
    ELSE
      RETURN acceptance_date; -- immediate
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle negotiation acceptance
CREATE OR REPLACE FUNCTION handle_negotiation_acceptance(
  proposal_id uuid,
  is_sync_proposal boolean DEFAULT true
) RETURNS void AS $$
DECLARE
  acceptance_date timestamptz := NOW();
  payment_terms text;
  final_amount numeric;
BEGIN
  IF is_sync_proposal THEN
    -- Update sync proposal
    UPDATE sync_proposals 
    SET 
      negotiation_status = 'accepted',
      client_accepted_at = acceptance_date,
      final_amount = COALESCE(negotiated_amount, sync_fee),
      final_payment_terms = COALESCE(negotiated_payment_terms, payment_terms),
      payment_due_date = calculate_payment_due_date(acceptance_date, COALESCE(negotiated_payment_terms, payment_terms)),
      updated_at = acceptance_date
    WHERE id = proposal_id;
  ELSE
    -- Update custom sync request
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

-- Create function to handle negotiation rejection
CREATE OR REPLACE FUNCTION handle_negotiation_rejection(
  proposal_id uuid,
  is_sync_proposal boolean DEFAULT true
) RETURNS void AS $$
BEGIN
  IF is_sync_proposal THEN
    -- Update sync proposal
    UPDATE sync_proposals 
    SET 
      negotiation_status = 'rejected',
      updated_at = NOW()
    WHERE id = proposal_id;
  ELSE
    -- Update custom sync request
    UPDATE custom_sync_requests 
    SET 
      negotiation_status = 'rejected',
      updated_at = NOW()
    WHERE id = proposal_id;
  END IF;
END;
$$ LANGUAGE plpgsql; 