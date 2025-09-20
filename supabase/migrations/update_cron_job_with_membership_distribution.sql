-- Fix Custom Sync Request selected_producer_id and Banking Integration
-- This migration ensures that selected_producer_id is always set correctly
-- and that custom sync requests are properly included in producer banking

-- Step 1: Add a trigger function to automatically set selected_producer_id
CREATE OR REPLACE FUNCTION ensure_custom_sync_selected_producer()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if payment_status is 'paid' and selected_producer_id is NULL
  IF NEW.payment_status = 'paid' AND NEW.selected_producer_id IS NULL THEN
    -- Try to get the selected producer from sync_request_selections
    SELECT ss.producer_id INTO NEW.selected_producer_id
    FROM sync_request_selections srs
    JOIN sync_submissions ss ON srs.selected_submission_id = ss.id
    WHERE srs.sync_request_id = NEW.id
    LIMIT 1;
    
    -- Update the timestamp
    NEW.updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger to automatically set selected_producer_id
DROP TRIGGER IF EXISTS trigger_ensure_custom_sync_selected_producer ON custom_sync_requests;
CREATE TRIGGER trigger_ensure_custom_sync_selected_producer
  BEFORE UPDATE ON custom_sync_requests
  FOR EACH ROW
  EXECUTE FUNCTION ensure_custom_sync_selected_producer();

-- Step 3: Fix any existing custom sync requests missing selected_producer_id
UPDATE custom_sync_requests 
SET 
    selected_producer_id = (
        SELECT ss.producer_id
        FROM sync_request_selections srs
        JOIN sync_submissions ss ON srs.selected_submission_id = ss.id
        WHERE srs.sync_request_id = custom_sync_requests.id
        LIMIT 1
    ),
    updated_at = NOW()
WHERE payment_status = 'paid' 
  AND selected_producer_id IS NULL
  AND EXISTS (
      SELECT 1
      FROM sync_request_selections srs
      WHERE srs.sync_request_id = custom_sync_requests.id
  );

-- Step 4: Create missing transaction records for paid custom sync requests
INSERT INTO producer_transactions (
    transaction_producer_id,
    amount,
    type,
    status,
    description,
    track_title,
    reference_id,
    created_at
)
SELECT 
    csr.selected_producer_id,
    COALESCE(csr.final_amount, csr.sync_fee) * 0.70, -- 70% producer share
    'sale',
    'pending',
    'Custom Sync: ' || COALESCE(csr.project_title, 'Custom Sync Request'),
    COALESCE(csr.project_title, 'Custom Sync Request'),
    csr.id::text,
    COALESCE(csr.updated_at, csr.created_at)
FROM custom_sync_requests csr
WHERE csr.payment_status = 'paid'
  AND csr.selected_producer_id IS NOT NULL
  AND csr.id::text NOT IN (
    SELECT reference_id FROM producer_transactions 
    WHERE reference_id IS NOT NULL
  );

-- Step 5: Update producer balances for paid custom sync requests
WITH custom_sync_totals AS (
    SELECT 
        csr.selected_producer_id,
        SUM(COALESCE(csr.final_amount, csr.sync_fee) * 0.70) as total_custom_sync_revenue
    FROM custom_sync_requests csr
    WHERE csr.payment_status = 'paid'
      AND csr.selected_producer_id IS NOT NULL
      AND csr.id::text NOT IN (
        SELECT reference_id FROM producer_transactions 
        WHERE reference_id IS NOT NULL
      )
    GROUP BY csr.selected_producer_id
)
INSERT INTO producer_balances (
    balance_producer_id,
    pending_balance,
    available_balance,
    lifetime_earnings
)
SELECT 
    cst.selected_producer_id,
    cst.total_custom_sync_revenue,
    0,
    cst.total_custom_sync_revenue
FROM custom_sync_totals cst
ON CONFLICT (balance_producer_id) DO UPDATE
SET 
    pending_balance = producer_balances.pending_balance + EXCLUDED.pending_balance,
    lifetime_earnings = producer_balances.lifetime_earnings + EXCLUDED.lifetime_earnings;

-- Step 6: Add a function to sync custom sync requests to producer transactions
CREATE OR REPLACE FUNCTION sync_custom_sync_to_transactions()
RETURNS TRIGGER AS $$
DECLARE
    v_producer_amount numeric;
    v_compensation_settings record;
BEGIN
    -- Only process when payment_status changes to 'paid' and selected_producer_id is set
    IF NEW.payment_status = 'paid' AND NEW.selected_producer_id IS NOT NULL THEN
        -- Get compensation settings
        SELECT * INTO v_compensation_settings FROM compensation_settings LIMIT 1;
        
        -- Default to 70% if no settings found
        IF v_compensation_settings IS NULL THEN
            v_producer_amount := COALESCE(NEW.final_amount, NEW.sync_fee) * 0.70;
        ELSE
            v_producer_amount := COALESCE(NEW.final_amount, NEW.sync_fee) * (v_compensation_settings.sync_fee_rate / 100.0);
        END IF;
        
        -- Create transaction record if it doesn't exist
        INSERT INTO producer_transactions (
            transaction_producer_id,
            amount,
            type,
            status,
            description,
            track_title,
            reference_id,
            created_at
        )
        VALUES (
            NEW.selected_producer_id,
            v_producer_amount,
            'sale',
            'pending',
            'Custom Sync: ' || COALESCE(NEW.project_title, 'Custom Sync Request'),
            COALESCE(NEW.project_title, 'Custom Sync Request'),
            NEW.id::text,
            NEW.updated_at
        )
        ON CONFLICT (reference_id) DO NOTHING;
        
        -- Update producer balance
        INSERT INTO producer_balances (
            balance_producer_id,
            pending_balance,
            available_balance,
            lifetime_earnings
        )
        VALUES (
            NEW.selected_producer_id,
            v_producer_amount,
            0,
            v_producer_amount
        )
        ON CONFLICT (balance_producer_id) DO UPDATE
        SET 
            pending_balance = producer_balances.pending_balance + EXCLUDED.pending_balance,
            lifetime_earnings = producer_balances.lifetime_earnings + EXCLUDED.lifetime_earnings;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to automatically sync custom sync requests to transactions
DROP TRIGGER IF EXISTS trigger_sync_custom_sync_to_transactions ON custom_sync_requests;
CREATE TRIGGER trigger_sync_custom_sync_to_transactions
  AFTER UPDATE ON custom_sync_requests
  FOR EACH ROW
  EXECUTE FUNCTION sync_custom_sync_to_transactions();

-- Step 8: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_sync_requests_payment_status ON custom_sync_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_custom_sync_requests_selected_producer ON custom_sync_requests(selected_producer_id);
CREATE INDEX IF NOT EXISTS idx_sync_request_selections_sync_request ON sync_request_selections(sync_request_id);
CREATE INDEX IF NOT EXISTS idx_sync_submissions_sync_request ON sync_submissions(sync_request_id);

-- Step 9: Verify the fixes
SELECT 'Custom sync requests with missing selected_producer_id:' as check_type, COUNT(*) as count
FROM custom_sync_requests 
WHERE payment_status = 'paid' AND selected_producer_id IS NULL;

SELECT 'Custom sync requests with missing transactions:' as check_type, COUNT(*) as count
FROM custom_sync_requests csr
WHERE csr.payment_status = 'paid' 
  AND csr.selected_producer_id IS NOT NULL
  AND csr.id::text NOT IN (
    SELECT reference_id FROM producer_transactions 
    WHERE reference_id IS NOT NULL
  );

-- Step 10: Summary of changes
SELECT 'Migration completed successfully' as status;
