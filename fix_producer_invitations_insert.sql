-- Fix the producer_invitations insert issue
-- Option 1: Make created_by nullable if it's not required
ALTER TABLE producer_invitations ALTER COLUMN created_by DROP NOT NULL;

-- Option 2: Or update the RLS policy to allow inserts without created_by
DROP POLICY IF EXISTS "Admin access to producer invitations" ON producer_invitations;

CREATE POLICY "Admin access to producer invitations" ON producer_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
    OR auth.role() = 'service_role'
  );

-- Test the insert again
INSERT INTO producer_invitations (
  email, 
  first_name, 
  last_name, 
  invitation_code, 
  producer_number
) VALUES (
  'test@example.com',
  'Test',
  'User',
  'testcode123',
  'mbfpr-999'
);
