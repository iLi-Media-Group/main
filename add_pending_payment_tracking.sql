-- Add pending payment tracking for sync requests

-- Add payment terms and due date columns to custom_sync_requests
ALTER TABLE custom_sync_requests 
ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(10) DEFAULT 'net30' CHECK (payment_terms IN ('net30', 'net60', 'net90')),
ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled'));

-- Create a function to calculate payment due date based on terms
CREATE OR REPLACE FUNCTION calculate_payment_due_date(
  p_terms VARCHAR(10),
  p_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  CASE p_terms
    WHEN 'net30' THEN RETURN p_created_at + INTERVAL '30 days';
    WHEN 'net60' THEN RETURN p_created_at + INTERVAL '60 days';
    WHEN 'net90' THEN RETURN p_created_at + INTERVAL '90 days';
    ELSE RETURN p_created_at + INTERVAL '30 days';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create a view for pending payments analytics
CREATE OR REPLACE VIEW pending_payments_analytics AS
SELECT 
  csr.id as sync_request_id,
  csr.project_title,
  csr.sync_fee,
  csr.payment_terms,
  csr.payment_due_date,
  csr.payment_status,
  csr.created_at,
  csr.client_id,
  c.first_name as client_first_name,
  c.last_name as client_last_name,
  c.email as client_email,
  ss.id as selected_submission_id,
  ss.track_name,
  p.id as producer_id,
  p.first_name as producer_first_name,
  p.last_name as producer_last_name,
  p.email as producer_email,
  CASE 
    WHEN csr.payment_due_date < NOW() THEN 'overdue'
    WHEN csr.payment_due_date < NOW() + INTERVAL '7 days' THEN 'due_soon'
    ELSE 'pending'
  END as urgency_status
FROM custom_sync_requests csr
LEFT JOIN profiles c ON csr.client_id = c.id
LEFT JOIN sync_submissions ss ON csr.selected_submission_id = ss.id
LEFT JOIN profiles p ON ss.producer_id = p.id
WHERE csr.payment_status = 'pending'
  AND csr.selected_submission_id IS NOT NULL;

-- Create a view for producer pending payments
CREATE OR REPLACE VIEW producer_pending_payments AS
SELECT 
  p.id as producer_id,
  p.first_name,
  p.last_name,
  p.email,
  COUNT(ppa.sync_request_id) as total_pending_requests,
  SUM(ppa.sync_fee) as total_pending_amount,
  AVG(ppa.sync_fee) as avg_pending_amount,
  COUNT(CASE WHEN ppa.urgency_status = 'overdue' THEN 1 END) as overdue_count,
  COUNT(CASE WHEN ppa.urgency_status = 'due_soon' THEN 1 END) as due_soon_count
FROM profiles p
LEFT JOIN pending_payments_analytics ppa ON p.id = ppa.producer_id
WHERE p.role = 'producer'
GROUP BY p.id, p.first_name, p.last_name, p.email;

-- Create a function to update payment due dates for existing records
CREATE OR REPLACE FUNCTION update_existing_payment_due_dates()
RETURNS VOID AS $$
BEGIN
  UPDATE custom_sync_requests 
  SET payment_due_date = calculate_payment_due_date(payment_terms, created_at)
  WHERE payment_due_date IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a function to mark payments as overdue
CREATE OR REPLACE FUNCTION mark_overdue_payments()
RETURNS VOID AS $$
BEGIN
  UPDATE custom_sync_requests 
  SET payment_status = 'overdue'
  WHERE payment_status = 'pending' 
    AND payment_due_date < NOW()
    AND selected_submission_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON pending_payments_analytics TO authenticated;
GRANT SELECT ON producer_pending_payments TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_payment_due_date(VARCHAR, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION update_existing_payment_due_dates() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_overdue_payments() TO authenticated;

-- Update existing records
SELECT update_existing_payment_due_dates();
SELECT mark_overdue_payments(); 