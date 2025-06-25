-- Create function to insert producer balance on new producer profile
CREATE OR REPLACE FUNCTION create_producer_balance_on_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create balance for producers
  IF NEW.role = 'producer' THEN
    INSERT INTO producer_balances (producer_id, available_balance, pending_balance, lifetime_earnings)
    VALUES (NEW.id, 0, 0, 0)
    ON CONFLICT (producer_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_create_producer_balance ON profiles;
CREATE TRIGGER trigger_create_producer_balance
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_producer_balance_on_profile_insert();

-- One-time backfill for existing producers
INSERT INTO producer_balances (producer_id, available_balance, pending_balance, lifetime_earnings)
SELECT id, 0, 0, 0
FROM profiles
WHERE role = 'producer'
  AND id NOT IN (SELECT producer_id FROM producer_balances); 