-- Create rights holder application system
-- Following the same pattern as producer and artist applications

-- 1. Create rights_holder_applications table
CREATE TABLE IF NOT EXISTS rights_holder_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  rights_holder_type TEXT NOT NULL CHECK (rights_holder_type IN ('record_label', 'publisher')),
  website TEXT,
  company_size TEXT,
  years_in_business INTEGER,
  primary_genres TEXT[],
  catalog_size INTEGER,
  has_sync_experience BOOLEAN DEFAULT false,
  sync_experience_details TEXT,
  has_licensing_team BOOLEAN DEFAULT false,
  licensing_team_size INTEGER,
  revenue_range TEXT,
  target_markets TEXT[],
  additional_info TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'invited', 'onboarded', 'save_for_later', 'declined', 'manual_review')),
  review_tier TEXT,
  auto_disqualified BOOLEAN DEFAULT false,
  application_score INTEGER DEFAULT 0,
  score_breakdown JSONB,
  rejection_reason TEXT,
  manual_review_approved BOOLEAN DEFAULT false,
  manual_review BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create rights_holder_invitations table
CREATE TABLE IF NOT EXISTS rights_holder_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  invitation_code TEXT NOT NULL UNIQUE,
  rights_holder_number TEXT NOT NULL UNIQUE,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create get_next_rights_holder_number function
CREATE OR REPLACE FUNCTION get_next_rights_holder_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  result TEXT;
BEGIN
  -- Get the highest existing number
  SELECT COALESCE(MAX(CAST(SUBSTRING(rights_holder_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM rights_holder_invitations
  WHERE rights_holder_number ~ '^mbfr-[0-9]+$';
  
  -- Format the result
  result := 'mbfr-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_next_rights_holder_number() TO authenticated;

-- 4. Enable RLS on both tables
ALTER TABLE rights_holder_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_invitations ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for rights_holder_applications
CREATE POLICY "Enable read access for admins" ON rights_holder_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

CREATE POLICY "Enable insert access for admins" ON rights_holder_applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

CREATE POLICY "Enable update access for admins" ON rights_holder_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

CREATE POLICY "Enable service role access" ON rights_holder_applications
  FOR ALL USING (auth.role() = 'service_role');

-- 6. Create RLS policies for rights_holder_invitations
CREATE POLICY "Enable read access for admins" ON rights_holder_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

CREATE POLICY "Enable insert access for admins" ON rights_holder_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

CREATE POLICY "Enable update access for admins" ON rights_holder_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

CREATE POLICY "Enable service role access" ON rights_holder_invitations
  FOR ALL USING (auth.role() = 'service_role');

-- 7. Test the function
SELECT get_next_rights_holder_number() as next_rights_holder_number;


