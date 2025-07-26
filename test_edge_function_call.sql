-- Test the Edge Function with a valid discount ID

-- Get the discount ID for testing
SELECT 'Use this discount_id to test the Edge Function:' as info;
SELECT 
    id as discount_id,
    name,
    promotion_code,
    discount_percent
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC
LIMIT 1;

-- Instructions for testing:
SELECT 'Instructions:' as info;
SELECT 
    '1. Open browser dev tools (F12)' as step,
    '2. Go to Console tab' as step2,
    '3. Run this JavaScript:' as step3,
    'fetch("https://yciqkebqlajqbpwlujma.supabase.co/functions/v1/test-stripe-coupon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("supabase.auth.token")
      },
      body: JSON.stringify({ discount_id: "DISCOUNT_ID_FROM_ABOVE" })
    })
    .then(r => r.json())
    .then(console.log)
    .catch(console.error)' as javascript_code; 