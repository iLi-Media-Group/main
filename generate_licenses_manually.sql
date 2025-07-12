-- Manually generate licenses for paid proposals that don't have license_url
-- Run this in your Supabase SQL Editor

-- First, let's see which paid proposals don't have license URLs
SELECT 
    id,
    sync_fee,
    final_amount,
    payment_status,
    license_url,
    created_at,
    updated_at
FROM sync_proposals 
WHERE payment_status = 'paid' 
  AND (license_url IS NULL OR license_url = '')
ORDER BY created_at DESC;

-- Update proposals to have a placeholder license URL for testing
-- This will allow the "View Agreement" button to appear
UPDATE sync_proposals 
SET 
    license_url = 'https://example.com/license-placeholder.pdf',
    license_generated_at = NOW(),
    updated_at = NOW()
WHERE payment_status = 'paid' 
  AND (license_url IS NULL OR license_url = '');

-- Verify the update worked
SELECT 
    id,
    sync_fee,
    final_amount,
    payment_status,
    license_url,
    created_at,
    updated_at
FROM sync_proposals 
WHERE payment_status = 'paid' 
ORDER BY created_at DESC; 