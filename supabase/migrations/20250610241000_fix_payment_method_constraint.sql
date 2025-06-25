-- Fix payment method check constraint in subscriptions table
-- The constraint is blocking valid payment method values like 'visa'

-- First, let's see what the current constraint allows
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'subscriptions'::regclass 
AND contype = 'c';

-- Drop the existing check constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_payment_method_check' 
    AND conrelid = 'subscriptions'::regclass
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_payment_method_check;
  END IF;
END $$;

-- Add a more permissive check constraint that allows common payment method values
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_payment_method_check 
CHECK (
  payment_method IS NULL OR 
  payment_method IN (
    'stripe',
    'crypto',
    'visa',
    'mastercard',
    'amex',
    'discover',
    'jcb',
    'diners_club',
    'unionpay',
    'card'
  )
);

-- Also check if there are any other constraints that might be blocking the insert
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'subscriptions'::regclass
ORDER BY contype, conname; 