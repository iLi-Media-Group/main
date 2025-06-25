-- Fix existing subscription data with invalid plan names or dates
-- This migration ensures all existing subscriptions have proper data

-- Update any subscriptions with 'Unknown' plan names
UPDATE stripe_subscriptions 
SET price_id = CASE 
  WHEN subscription_id LIKE 'sub_%' THEN 'price_1RdAfqR8RYA8TFzwKP7zrKsm' -- Default to Ultimate Access
  ELSE price_id 
END
WHERE price_id IS NULL OR price_id = '';

-- Update any subscriptions with invalid dates (12/31/1969 = timestamp 0)
UPDATE stripe_subscriptions 
SET 
  current_period_start = EXTRACT(EPOCH FROM NOW()),
  current_period_end = EXTRACT(EPOCH FROM NOW() + INTERVAL '1 month')
WHERE current_period_start = 0 OR current_period_start IS NULL;

-- Ensure all active subscriptions have proper status
UPDATE stripe_subscriptions 
SET status = 'active'
WHERE status IS NULL AND subscription_id IS NOT NULL;

-- Log the current state for debugging
SELECT 
  customer_id,
  subscription_id,
  price_id,
  status,
  current_period_start,
  current_period_end,
  CASE 
    WHEN current_period_start > 0 THEN to_timestamp(current_period_start)
    ELSE NULL 
  END as period_start_date,
  CASE 
    WHEN current_period_end > 0 THEN to_timestamp(current_period_end)
    ELSE NULL 
  END as period_end_date
FROM stripe_subscriptions
ORDER BY created_at DESC; 