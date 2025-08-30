-- Add agent-related columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_agent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agent_commission_percentage DECIMAL(5,2) DEFAULT 20.00;

-- Update user 777@777llc.com to be an agent
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
