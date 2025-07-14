-- Fix the negotiation_status constraint error
-- The issue is that different migrations have defined different allowed values for negotiation_status

-- First, let's see what the current constraint allows
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'sync_proposals'::regclass 
AND conname LIKE '%negotiation_status%';

-- Drop the existing constraint
ALTER TABLE sync_proposals DROP CONSTRAINT IF EXISTS sync_proposals_negotiation_status_check;

-- Add the correct constraint with all the values that are actually used in the code
ALTER TABLE sync_proposals ADD CONSTRAINT sync_proposals_negotiation_status_check 
CHECK (negotiation_status IN (
    'pending', 
    'negotiating', 
    'client_acceptance_required', 
    'producer_accepted',
    'client_accepted',
    'accepted', 
    'rejected',
    'open',
    'completed'
));

-- Update any existing records that might have invalid values
UPDATE sync_proposals 
SET negotiation_status = 'pending'
WHERE negotiation_status NOT IN (
    'pending', 
    'negotiating', 
    'client_acceptance_required', 
    'producer_accepted',
    'client_accepted',
    'accepted', 
    'rejected',
    'open',
    'completed'
);

-- Verify the constraint is working
SELECT DISTINCT negotiation_status, COUNT(*) 
FROM sync_proposals 
GROUP BY negotiation_status
ORDER BY negotiation_status; 