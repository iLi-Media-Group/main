-- Add business fields to profiles table for clients
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS business_type text CHECK (business_type IN ('sole-proprietor', 'llc', 'corporation', 'partnership')),
ADD COLUMN IF NOT EXISTS ein text,
ADD COLUMN IF NOT EXISTS business_name text;

-- Add comment to explain the business fields
COMMENT ON COLUMN profiles.business_type IS 'Type of business entity: sole-proprietor, llc, corporation, partnership';
COMMENT ON COLUMN profiles.ein IS 'Employer Identification Number for business entities';
COMMENT ON COLUMN profiles.business_name IS 'Legal business name (separate from company_name for display purposes)';

-- Create index for business queries
CREATE INDEX IF NOT EXISTS idx_profiles_business_type ON profiles(business_type);
CREATE INDEX IF NOT EXISTS idx_profiles_ein ON profiles(ein); 