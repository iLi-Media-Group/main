-- First, let's see what the current constraint allows
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname = 'profiles_account_type_check';

-- Add agent-related columns to profiles table FIRST
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_agent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agent_commission_percentage DECIMAL(5,2) DEFAULT 20.00;

-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;

-- Add the new constraint that includes 'agent'
ALTER TABLE profiles 
ADD CONSTRAINT profiles_account_type_check 
CHECK (account_type IN ('client', 'producer', 'artist_band', 'rights_holder', 'admin', 'admin,producer', 'agent', 'white_label'));

-- Now update the user to be an agent
UPDATE profiles 
SET 
  account_type = 'agent',
  is_agent = true,
  agent_commission_percentage = 20.00,
  updated_at = NOW()
WHERE email = '777@777llc.com';

-- Verify the change
SELECT 
  id,
  email,
  first_name,
  last_name,
  company_name,
  account_type,
  is_agent,
  agent_commission_percentage,
  updated_at
FROM profiles 
WHERE email = '777@777llc.com'; 