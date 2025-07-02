-- Migration: Rename all producer_id columns to unique, descriptive names

-- 1. tracks
ALTER TABLE tracks RENAME COLUMN producer_id TO track_producer_id;

-- 2. sales
ALTER TABLE sales RENAME COLUMN producer_id TO sale_producer_id;

-- 3. producer_balances
ALTER TABLE producer_balances RENAME COLUMN producer_id TO balance_producer_id;

-- 4. producer_transactions
ALTER TABLE producer_transactions RENAME COLUMN producer_id TO transaction_producer_id;

-- 5. producer_payment_methods
ALTER TABLE producer_payment_methods RENAME COLUMN producer_id TO payment_method_producer_id;

-- 6. producer_withdrawals
ALTER TABLE producer_withdrawals RENAME COLUMN producer_id TO withdrawal_producer_id;

-- 7. sync_proposals
ALTER TABLE sync_proposals RENAME COLUMN producer_id TO proposal_producer_id;

-- NOTE: Update all foreign key constraints, indexes, triggers, and policies as needed after renaming. 