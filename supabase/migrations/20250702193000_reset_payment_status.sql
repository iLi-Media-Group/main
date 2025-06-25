-- Reset payment status for the specific proposal to allow testing the full payment flow
-- This proposal got stuck with payment_status = 'pending' due to CORS errors

UPDATE sync_proposals 
SET 
  payment_status = NULL,
  stripe_checkout_session_id = NULL,
  payment_due_date = NULL
WHERE id = '7af40356-66f3-45d7-87f3-710dff65b46a'; 