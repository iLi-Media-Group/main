-- Add assigned_agent field to pitch_opportunities table
-- This allows assigning agents to specific pitch opportunities

-- Add assigned_agent column to pitch_opportunities table
ALTER TABLE pitch_opportunities 
ADD COLUMN IF NOT EXISTS assigned_agent UUID REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_pitch_opportunities_assigned_agent ON pitch_opportunities(assigned_agent);

-- Update RLS policy to allow agents to see their assigned opportunities
DROP POLICY IF EXISTS "Pitch opportunities are viewable by authenticated users" ON pitch_opportunities;
CREATE POLICY "Pitch opportunities are viewable by authenticated users" ON pitch_opportunities
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Admins can see all opportunities
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND account_type IN ('admin', 'admin,producer')
            )
            OR
            -- Assigned agents can see their opportunities
            assigned_agent = auth.uid()
        )
    );

-- Allow admins to insert/update opportunities
DROP POLICY IF EXISTS "Pitch opportunities are insertable by admins" ON pitch_opportunities;
CREATE POLICY "Pitch opportunities are insertable by admins" ON pitch_opportunities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type IN ('admin', 'admin,producer')
        )
    );

DROP POLICY IF EXISTS "Pitch opportunities are updatable by admins" ON pitch_opportunities;
CREATE POLICY "Pitch opportunities are updatable by admins" ON pitch_opportunities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type IN ('admin', 'admin,producer')
        )
    );

-- Add comment for documentation
COMMENT ON COLUMN pitch_opportunities.assigned_agent IS 'Agent assigned to handle this pitch opportunity';
