-- Test script to check service onboarding setup

-- 1. Check if the table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'service_onboarding_tokens'
ORDER BY ordinal_position;

-- 2. Check if there are any existing tokens
SELECT COUNT(*) as token_count FROM service_onboarding_tokens;

-- 3. Check if email_logs table exists
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'email_logs'
ORDER BY ordinal_position;

-- 4. Check recent email logs
SELECT 
    to_email,
    subject,
    sent_at,
    status,
    provider,
    email_type
FROM email_logs 
WHERE email_type = 'service_onboarding'
ORDER BY sent_at DESC
LIMIT 5;
