-- Migration: Add renewal fields for license renewal workflow

-- 1. Add renewal fields to sales (regular licenses)
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS renewal_status text DEFAULT 'none' CHECK (renewal_status IN ('none', 'pending', 'approved', 'rejected', 'expired')),
  ADD COLUMN IF NOT EXISTS renewal_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS renewal_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS renewal_rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS renewal_reason text,
  ADD COLUMN IF NOT EXISTS renewal_payment_id text;

-- 2. Add renewal fields to sync_proposals (sync/custom licenses)
ALTER TABLE sync_proposals
  ADD COLUMN IF NOT EXISTS renewal_status text DEFAULT 'none' CHECK (renewal_status IN ('none', 'pending_producer', 'producer_approved', 'producer_rejected', 'expired')),
  ADD COLUMN IF NOT EXISTS renewal_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS renewal_responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS renewal_reason text,
  ADD COLUMN IF NOT EXISTS renewal_payment_id text; 