-- Fix producer balance trigger function to use correct column name and support multiple roles
CREATE OR REPLACE FUNCTION create_producer_balance_on_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create balance for producers (even if they have multiple roles)
  IF NEW.account_type LIKE '%producer%' THEN
    INSERT INTO producer_balances (balance_producer_id, available_balance, pending_balance, lifetime_earnings)
    VALUES (NEW.id, 0, 0, 0)
    ON CONFLICT (balance_producer_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the one-time backfill query to use correct column name and support multiple roles
INSERT INTO producer_balances (balance_producer_id, available_balance, pending_balance, lifetime_earnings)
SELECT id, 0, 0, 0
FROM profiles
WHERE account_type LIKE '%producer%'
  AND id NOT IN (SELECT balance_producer_id FROM producer_balances); 