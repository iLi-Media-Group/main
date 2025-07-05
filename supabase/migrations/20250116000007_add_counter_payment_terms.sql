-- Migration: Add counter_payment_terms column to proposal_negotiations table
-- This enables producers to propose different payment terms during negotiations

-- Add counter_payment_terms column to proposal_negotiations
ALTER TABLE proposal_negotiations 
ADD COLUMN IF NOT EXISTS counter_payment_terms text CHECK (counter_payment_terms IN ('immediate', 'net30', 'net60', 'net90'));

-- Add comment for documentation
COMMENT ON COLUMN proposal_negotiations.counter_payment_terms IS 'Proposed payment terms during negotiation (immediate, net30, net60, net90)'; 