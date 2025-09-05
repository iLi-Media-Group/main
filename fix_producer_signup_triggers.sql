-- Fix Producer Signup Triggers
-- This script fixes the database triggers that are causing 500 errors during producer signup

-- 1. Fix the producer balance trigger (wrong column name)
DROP TRIGGER IF EXISTS trigger_create_producer_balance ON profiles;
DROP FUNCTION IF EXISTS create_producer_balance_on_profile_insert();

CREATE OR REPLACE FUNCTION create_producer_balance_on_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create balance for producers (use account_type, not role)
  IF NEW.account_type = 'producer' THEN
    INSERT INTO producer_balances (producer_id, available_balance, pending_balance, lifetime_earnings)
    VALUES (NEW.id, 0, 0, 0)
    ON CONFLICT (producer_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_producer_balance
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_producer_balance_on_profile_insert();

-- 2. Fix the producer number trigger (wrong function name)
DROP TRIGGER IF EXISTS assign_producer_number_trigger ON profiles;
DROP FUNCTION IF EXISTS assign_producer_number();

-- Create the correct function name that matches what's being called
CREATE OR REPLACE FUNCTION generate_producer_number()
RETURNS TEXT AS $$
DECLARE
    next_number TEXT;
    max_number INTEGER := 0;
BEGIN
    -- Get the highest existing producer number from profiles table
    SELECT COALESCE(MAX(CAST(SUBSTRING(producer_number FROM 6) AS INTEGER)), 0)
    INTO max_number
    FROM profiles
    WHERE producer_number LIKE 'MBPR-%' AND producer_number IS NOT NULL;
    
    -- Generate the next number
    next_number := 'MBPR-' || LPAD((max_number + 1)::TEXT, 2, '0');
    
    RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Create the assign producer number function
CREATE OR REPLACE FUNCTION assign_producer_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.account_type = 'producer' AND NEW.producer_number IS NULL THEN
    NEW.producer_number = generate_producer_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER assign_producer_number_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION assign_producer_number();

-- 3. Verify all triggers are working
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 4. Test the functions
SELECT generate_producer_number() as test_producer_number;

-- 5. Check if producer_balances table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'producer_balances'
) as producer_balances_exists;

-- 6. Create producer_balances table if it doesn't exist
CREATE TABLE IF NOT EXISTS producer_balances (
    id SERIAL PRIMARY KEY,
    producer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    available_balance DECIMAL(10,2) DEFAULT 0,
    pending_balance DECIMAL(10,2) DEFAULT 0,
    lifetime_earnings DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(producer_id)
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_producer_balances_producer_id ON producer_balances(producer_id);

-- 8. Add RLS policies for producer_balances if needed
ALTER TABLE producer_balances ENABLE ROW LEVEL SECURITY;

-- Policy for producers to view their own balance
DROP POLICY IF EXISTS "Producers can view own balance" ON producer_balances;
CREATE POLICY "Producers can view own balance" ON producer_balances
    FOR SELECT USING (auth.uid() = producer_id);

-- Policy for system to insert balances
DROP POLICY IF EXISTS "System can insert producer balances" ON producer_balances;
CREATE POLICY "System can insert producer balances" ON producer_balances
    FOR INSERT WITH CHECK (true);

-- 9. Backfill existing producers with balances
INSERT INTO producer_balances (producer_id, available_balance, pending_balance, lifetime_earnings)
SELECT id, 0, 0, 0
FROM profiles
WHERE account_type = 'producer'
  AND id NOT IN (SELECT producer_id FROM producer_balances);

-- 10. Final verification
SELECT 
    'Triggers fixed successfully' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN account_type = 'producer' THEN 1 END) as producer_profiles,
    COUNT(CASE WHEN producer_number IS NOT NULL THEN 1 END) as profiles_with_numbers
FROM profiles;
