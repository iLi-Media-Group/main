-- Add agent commission system to database
-- This script adds agent functionality and commission tracking

-- 1. Add agent fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_agent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agent_commission_percentage DECIMAL(5,2) DEFAULT 0.00;

-- 2. Add agent commission fields to custom_sync_requests table
ALTER TABLE custom_sync_requests 
ADD COLUMN IF NOT EXISTS agent_commission_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS agent_commission_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS final_compensation_amount DECIMAL(10,2) DEFAULT 0.00;

-- 3. Add agent commission tracking to completed deals
ALTER TABLE custom_sync_requests 
ADD COLUMN IF NOT EXISTS agent_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agent_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS agent_payment_reference TEXT;

-- 4. Create agent earnings table for tracking commissions
CREATE TABLE IF NOT EXISTS agent_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES profiles(id),
    custom_sync_request_id UUID NOT NULL REFERENCES custom_sync_requests(id),
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_percentage DECIMAL(5,2) NOT NULL,
    total_deal_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_reference TEXT
);

-- 5. Add RLS policies for agent_earnings
ALTER TABLE agent_earnings ENABLE ROW LEVEL SECURITY;

-- Allow agents to view their own earnings
CREATE POLICY "Agents can view own earnings" ON agent_earnings
    FOR SELECT TO authenticated
    USING (agent_id = auth.uid());

-- Allow admins to view all earnings
CREATE POLICY "Admins can view all agent earnings" ON agent_earnings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type LIKE '%admin%'
        )
    );

-- Allow service role full access
CREATE POLICY "Service role can manage agent earnings" ON agent_earnings
    FOR ALL TO service_role
    USING (true);

-- 6. Create function to calculate agent commission
CREATE OR REPLACE FUNCTION calculate_agent_commission(
    total_amount DECIMAL(10,2),
    commission_percentage DECIMAL(5,2)
) RETURNS DECIMAL(10,2) AS $$
BEGIN
    -- Commission is deducted from the 90% that goes to producers/artists/rights holders
    -- So if total is $1000, 90% is $900, and agent gets commission from that $900
    RETURN (total_amount * 0.90 * commission_percentage / 100.0);
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to update final compensation when agent commission is set
CREATE OR REPLACE FUNCTION update_agent_commission()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate agent commission from the 90% portion
    NEW.agent_commission_amount = calculate_agent_commission(NEW.sync_fee, NEW.agent_commission_percentage);
    
    -- Calculate final compensation (90% - agent commission)
    NEW.final_compensation_amount = (NEW.sync_fee * 0.90) - NEW.agent_commission_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to automatically calculate commissions
CREATE TRIGGER trigger_update_agent_commission
    BEFORE INSERT OR UPDATE ON custom_sync_requests
    FOR EACH ROW
    WHEN (NEW.agent_commission_percentage > 0)
    EXECUTE FUNCTION update_agent_commission();

-- 9. Create function to record agent earnings when deal is completed
CREATE OR REPLACE FUNCTION record_agent_earnings()
RETURNS TRIGGER AS $$
BEGIN
    -- When a custom sync request is marked as completed/paid and has an agent
    IF NEW.status IN ('completed', 'paid') 
       AND OLD.status NOT IN ('completed', 'paid')
       AND NEW.agent_id IS NOT NULL 
       AND NEW.agent_commission_amount > 0 THEN
        
        INSERT INTO agent_earnings (
            agent_id,
            custom_sync_request_id,
            commission_amount,
            commission_percentage,
            total_deal_amount,
            status
        ) VALUES (
            NEW.agent_id,
            NEW.id,
            NEW.agent_commission_amount,
            NEW.agent_commission_percentage,
            NEW.sync_fee,
            'pending'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to record agent earnings
CREATE TRIGGER trigger_record_agent_earnings
    AFTER UPDATE ON custom_sync_requests
    FOR EACH ROW
    EXECUTE FUNCTION record_agent_earnings();

-- 11. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_sync_requests_agent_id ON custom_sync_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_earnings_agent_id ON agent_earnings(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_earnings_status ON agent_earnings(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_agent ON profiles(is_agent);

-- 12. Add comments for documentation
COMMENT ON COLUMN profiles.is_agent IS 'Indicates if this user is an agent representing clients';
COMMENT ON COLUMN profiles.agent_commission_percentage IS 'Default commission percentage for this agent (0-100)';
COMMENT ON COLUMN custom_sync_requests.agent_commission_percentage IS 'Commission percentage for this specific deal';
COMMENT ON COLUMN custom_sync_requests.agent_commission_amount IS 'Calculated commission amount for the agent';
COMMENT ON COLUMN custom_sync_requests.final_compensation_amount IS 'Final amount after MyBeatFi fee and agent commission';

-- Verify the changes
SELECT 'Agent commission system added successfully' as status;
