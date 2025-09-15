-- Create pitch subscription entry for admin/producer account (knockriobeats@gmail.com)
-- This gives the admin account permanent access to the pitch service

-- First, get the user_id for knockriobeats@gmail.com
-- Replace 'USER_UUID_HERE' with the actual UUID from the query below

-- Query to find the user_id:
-- SELECT id FROM auth.users WHERE email = 'knockriobeats@gmail.com';

-- Insert pitch subscription entry
INSERT INTO public.pitch_subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    price_id,
    first_activated_at,
    current_period_start,
    current_period_end,
    status,
    failed_renewal_attempts,
    is_active,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'knockriobeats@gmail.com'), -- Get user_id from email
    'admin_customer_' || (SELECT id FROM auth.users WHERE email = 'knockriobeats@gmail.com'), -- Generate fake customer ID
    'admin_subscription_' || (SELECT id FROM auth.users WHERE email = 'knockriobeats@gmail.com'), -- Generate fake subscription ID
    'admin_price_id', -- Admin price ID
    NOW(), -- First activated today
    EXTRACT(EPOCH FROM NOW())::bigint, -- Current period start (today as Unix timestamp)
    EXTRACT(EPOCH FROM (NOW() + INTERVAL '100 years'))::bigint, -- Current period end (100 years from now)
    'active', -- Status
    0, -- No failed renewal attempts
    true, -- Active
    NOW(), -- Created today
    NOW() -- Updated today
);

-- Verify the entry was created
SELECT 
    ps.*,
    u.email
FROM public.pitch_subscriptions ps
JOIN auth.users u ON ps.user_id = u.id
WHERE u.email = 'knockriobeats@gmail.com';
