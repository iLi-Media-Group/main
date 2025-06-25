-- Migration: Add payment fields to sync_proposals for negotiation/payment flow
ALTER TABLE sync_proposals
  ADD COLUMN final_amount integer,
  ADD COLUMN payment_due_date timestamptz,
  ADD COLUMN payment_status text,
  ADD COLUMN stripe_checkout_session_id text,
  ADD COLUMN stripe_payment_intent_id text; 