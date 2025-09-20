-- Comprehensive Fix for All Pending Balance Calculation Issues
-- This script addresses the root cause: pending_balance should be calculated from transactions, not accumulated

-- 1. First, let's see the current state and identify all issues
SELECT 
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    pb.pending_balance as stored_pending_balance,
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0) as calculated_pending_balance,
    CASE 
        WHEN pb.pending_balance = COALESCE((
            SELECT SUM(pt.amount)
            FROM producer_transactions pt
            WHERE pt.transaction_producer_id = p.id
              AND pt.type = 'sale'
              AND pt.status = 'pending'
              AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
              AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        ), 0) THEN 'MATCH'
        ELSE 'MISMATCH'
    END as status
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 2. Fix the sync_custom_sync_to_transactions function
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
        
        -- Update producer balance - only update lifetime_earnings
        INSERT INTO producer_balances (
            balance_producer_id,
            pending_balance,
            available_balance,
            lifetime_earnings
        )
        VALUES (
            NEW.selected_producer_id,
            0, -- Don't set pending_balance here
            0,
            v_producer_amount
        )
        ON CONFLICT (balance_producer_id) DO UPDATE
        SET 
            lifetime_earnings = producer_balances.lifetime_earnings + EXCLUDED.lifetime_earnings;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a function to recalculate pending balance for a specific producer
CREATE OR REPLACE FUNCTION recalculate_pending_balance(producer_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE producer_balances 
    SET 
        pending_balance = COALESCE((
            SELECT SUM(pt.amount)
            FROM producer_transactions pt
            WHERE pt.transaction_producer_id = producer_id
              AND pt.type = 'sale'
              AND pt.status = 'pending'
              AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
              AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        ), 0)
    WHERE balance_producer_id = producer_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a function to recalculate all pending balances
CREATE OR REPLACE FUNCTION recalculate_all_pending_balances()
RETURNS VOID AS $$
DECLARE
    producer_record RECORD;
BEGIN
    FOR producer_record IN 
        SELECT p.id
        FROM profiles p
        WHERE p.account_type IN ('producer', 'admin')
    LOOP
        PERFORM recalculate_pending_balance(producer_record.id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Create a trigger function to automatically recalculate pending balance when transactions change
CREATE OR REPLACE FUNCTION trigger_recalculate_pending_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate pending balance for the affected producer
    IF TG_OP = 'INSERT' THEN
        PERFORM recalculate_pending_balance(NEW.transaction_producer_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- If producer changed, recalculate for both old and new producer
        IF OLD.transaction_producer_id != NEW.transaction_producer_id THEN
            PERFORM recalculate_pending_balance(OLD.transaction_producer_id);
            PERFORM recalculate_pending_balance(NEW.transaction_producer_id);
        ELSE
            PERFORM recalculate_pending_balance(NEW.transaction_producer_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM recalculate_pending_balance(OLD.transaction_producer_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically recalculate pending balance when transactions change
DROP TRIGGER IF EXISTS trigger_recalculate_pending_balance_on_transactions ON producer_transactions;
CREATE TRIGGER trigger_recalculate_pending_balance_on_transactions
    AFTER INSERT OR UPDATE OR DELETE ON producer_transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_pending_balance();

-- 7. Recalculate all pending balances to fix current data
SELECT recalculate_all_pending_balances();

-- 8. Verify the fix
SELECT 
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    pb.pending_balance as new_pending_balance,
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0) as calculated_pending_balance,
    CASE 
        WHEN pb.pending_balance = COALESCE((
            SELECT SUM(pt.amount)
            FROM producer_transactions pt
            WHERE pt.transaction_producer_id = p.id
              AND pt.type = 'sale'
              AND pt.status = 'pending'
              AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
              AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        ), 0) THEN 'MATCH'
        ELSE 'MISMATCH'
    END as status
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 9. Show current month date range for reference
SELECT 
    'Current Month Start' as period,
    DATE_TRUNC('month', CURRENT_DATE) as date

UNION ALL

SELECT 
    'Current Month End' as period,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' as date

UNION ALL

SELECT 
    'Current Date' as period,
    CURRENT_DATE as date;

-- 10. Show breakdown of pending transactions by month
SELECT 
    DATE_TRUNC('month', pt.created_at) as month,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE pt.type = 'sale' 
  AND pt.status = 'pending'
  AND p.account_type IN ('producer', 'admin')
GROUP BY DATE_TRUNC('month', pt.created_at)
ORDER BY month DESC;

-- 11. Summary
SELECT 'PENDING BALANCE FIX COMPLETED' as status;
