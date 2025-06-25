/*
  # Cleanup Existing Subscriptions
  
  This migration cleans up any existing subscription data that might have
  incorrect plan names or invalid dates.
*/

-- Update any subscriptions with 'Unknown' plan names based on their stripe_subscription_id
UPDATE subscriptions 
SET membership_tier = CASE 
  WHEN stripe_subscription_id IS NOT NULL THEN
    (SELECT 
      CASE ss.price_id
        WHEN 'price_1RdAfqR8RYA8TFzwKP7zrKsm' THEN 'Ultimate Access'
        WHEN 'price_1RdAfXR8RYA8TFzwFZyaSREP' THEN 'Platinum Access'
        WHEN 'price_1RdAfER8RYA8TFzw7RrrNmtt' THEN 'Gold Access'
        WHEN 'price_1RdAeZR8RYA8TFzwVH3MHECa' THEN 'Single Track'
        ELSE membership_tier
      END
    FROM stripe_subscriptions ss 
    WHERE ss.subscription_id = subscriptions.stripe_subscription_id)
  ELSE membership_tier
END
WHERE membership_tier = 'Unknown' OR membership_tier IS NULL;

-- Fix any subscriptions with invalid dates (like 1969 dates)
UPDATE subscriptions 
SET 
  start_date = CASE 
    WHEN start_date IS NULL OR start_date < '1970-01-01' THEN NOW()
    ELSE start_date
  END,
  end_date = CASE 
    WHEN end_date IS NULL OR end_date < '1970-01-01' THEN
      CASE membership_tier
        WHEN 'Ultimate Access' THEN NOW() + INTERVAL '100 years'
        WHEN 'Platinum Access' THEN NOW() + INTERVAL '3 years'
        WHEN 'Gold Access' THEN NOW() + INTERVAL '1 year'
        WHEN 'Single Track' THEN NOW() + INTERVAL '1 year'
        ELSE NOW() + INTERVAL '1 year'
      END
    ELSE end_date
  END,
  next_billing_date = CASE 
    WHEN next_billing_date IS NULL OR next_billing_date < '1970-01-01' THEN end_date
    ELSE next_billing_date
  END,
  last_payment_date = CASE 
    WHEN last_payment_date IS NULL OR last_payment_date < '1970-01-01' THEN start_date
    ELSE last_payment_date
  END
WHERE start_date IS NULL OR start_date < '1970-01-01' 
   OR end_date IS NULL OR end_date < '1970-01-01'
   OR next_billing_date IS NULL OR next_billing_date < '1970-01-01'
   OR last_payment_date IS NULL OR last_payment_date < '1970-01-01'; 