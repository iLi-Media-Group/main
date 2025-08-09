/*
  # Update Monthly Payout Cron Job with Membership Distribution

  This migration updates the existing monthly payout cron job to also run
  the membership revenue distribution on the 10th of each month.
  
  The cron job will now:
  1. Generate monthly payouts (existing functionality)
  2. Distribute membership revenue to producers (new functionality)
  
  This ensures both regular payouts and membership compensation are processed
  together on the same schedule.
*/

-- Enable the pg_cron extension if not already enabled
create extension if not exists pg_cron with schema extensions;

-- Update the existing cron job to include membership distribution
select cron.schedule(
  'monthly-producer-payouts',
  '0 3 10 * *', -- At 03:00 on day-of-month 10
  $$
    -- First, generate monthly payouts (existing functionality)
    select net.http_post(
      url := supabase_url || '/functions/v1/generate-monthly-payouts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'month', to_char(current_date - interval '1 month', 'YYYY-MM')
      )
    ) as payout_request_id
    from secrets.supabase_url, secrets.service_role_key;
    
    -- Then, distribute membership revenue (new functionality)
    select distribute_membership_revenue(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')) as membership_distribution_result;
  $$
);

-- Create a separate cron job specifically for membership distribution
-- This runs on the 5th of each month to give time for data processing
select cron.schedule(
  'monthly-membership-distribution',
  '0 2 5 * *', -- At 02:00 on day-of-month 5
  $$
    select distribute_membership_revenue(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')) as membership_distribution_result;
  $$
);
