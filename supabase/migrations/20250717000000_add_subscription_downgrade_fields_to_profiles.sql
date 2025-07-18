-- Migration: Add subscription downgrade fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamp with time zone;

COMMENT ON COLUMN profiles.subscription_cancel_at_period_end IS 'True if the user has scheduled a downgrade/cancellation at the end of the current period.';
COMMENT ON COLUMN profiles.subscription_current_period_end IS 'The date/time when the current subscription period ends and the downgrade will take effect.'; 