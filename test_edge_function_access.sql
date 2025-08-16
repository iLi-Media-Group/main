-- Test Edge Function accessibility
-- This will help us verify the Edge Function is working

-- First, let's get a recent track to test with
SELECT 
    id as track_id,
    title,
    track_producer_id as producer_id
FROM tracks 
WHERE track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
ORDER BY created_at DESC 
LIMIT 1;

-- The Edge Function URL is:
-- https://yciqkebqlajqbpwlujma.supabase.co/functions/v1/send-producer-track-notification

-- You can test it manually with curl or Postman:
-- POST https://yciqkebqlajqbpwlujma.supabase.co/functions/v1/send-producer-track-notification
-- Headers: Content-Type: application/json
-- Body: {"track_id": "TRACK_ID_FROM_ABOVE", "producer_id": "83e21f94-aced-452a-bafb-6eb9629e3b18"}

-- Or test it from the browser console:
-- fetch('https://yciqkebqlajqbpwlujma.supabase.co/functions/v1/send-producer-track-notification', {
--   method: 'POST',
--   headers: { 'Content-Type': 'application/json' },
--   body: JSON.stringify({track_id: 'TRACK_ID_FROM_ABOVE', producer_id: '83e21f94-aced-452a-bafb-6eb9629e3b18'})
-- }).then(r => r.json()).then(console.log)
