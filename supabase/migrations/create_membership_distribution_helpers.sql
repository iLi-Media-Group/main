/*
  # Create Membership Distribution Helper Functions and Views

  This migration creates helper functions and views for the membership
  compensation plan, including manual trigger functions and status tracking.
*/

-- Create a function to manually trigger membership distribution (for testing/admin use)
CREATE OR REPLACE FUNCTION trigger_membership_distribution(month_date DATE DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    target_month DATE;
    result TEXT;
BEGIN
    -- If no month specified, use previous month
    IF month_date IS NULL THEN
        target_month := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
    ELSE
        target_month := month_date;
    END IF;
    
    -- Run the distribution
    PERFORM distribute_membership_revenue(target_month);
    
    result := 'Membership distribution completed for month: ' || to_char(target_month, 'YYYY-MM');
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users (for admin dashboard)
GRANT EXECUTE ON FUNCTION trigger_membership_distribution(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_membership_distribution() TO authenticated;

-- Create a view to show the last membership distribution status
CREATE OR REPLACE VIEW membership_distribution_status AS
SELECT 
    'Last Distribution' as status_type,
    COALESCE(
        (SELECT MAX(created_at) 
         FROM producer_transactions 
         WHERE type = 'membership_distribution'
         LIMIT 1),
        'Never'::text
    ) as last_distribution_date,
    COALESCE(
        (SELECT COUNT(*) 
         FROM producer_transactions 
         WHERE type = 'membership_distribution'
         AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')),
        0
    ) as distributions_this_month,
    COALESCE(
        (SELECT SUM(amount) 
         FROM producer_transactions 
         WHERE type = 'membership_distribution'
         AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')),
        0
    ) as total_distributed_this_month;

-- Grant select permission on the view
GRANT SELECT ON membership_distribution_status TO authenticated;
