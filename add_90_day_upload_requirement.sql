-- Add 90-day upload requirement to compensation plan
-- This ensures that producers, artists, and rights holders who haven't uploaded 
-- a new track in the last 90 days are excluded from the 2% bucket

-- 1. Create a function to check if a user has uploaded a track in the last 90 days
CREATE OR REPLACE FUNCTION has_uploaded_in_last_90_days(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    last_upload_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the most recent track upload date for this user
    SELECT MAX(created_at) INTO last_upload_date
    FROM tracks 
    WHERE track_producer_id = user_id 
      AND deleted_at IS NULL;
    
    -- Return true if they have uploaded a track in the last 90 days
    RETURN COALESCE(last_upload_date >= NOW() - INTERVAL '90 days', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the calculate_membership_revenue_summary function to exclude inactive uploaders
CREATE OR REPLACE FUNCTION calculate_membership_revenue_summary(
    month_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    active_subscriptions BIGINT,
    total_membership_revenue NUMERIC,
    producer_bucket_total NUMERIC,
    total_monthly_sales NUMERIC,
    no_sales_bucket NUMERIC,
    producer_id UUID,
    producer_email TEXT,
    producer_name TEXT,
    monthly_sales NUMERIC,
    previous_month_sales NUMERIC,
    growth_percentage NUMERIC,
    membership_share NUMERIC,
    growth_bonus NUMERIC,
    no_sale_bonus NUMERIC,
    total_membership_earnings NUMERIC,
    has_recent_upload BOOLEAN
) AS $$
DECLARE
    settings RECORD;
    total_membership_revenue NUMERIC;
    producer_bucket_total NUMERIC;
    total_monthly_sales NUMERIC;
    no_sales_bucket NUMERIC;
    active_uploaders_count INTEGER;
BEGIN
    -- Get compensation settings
    SELECT * INTO settings FROM compensation_settings WHERE id = 1;
    
    -- Calculate total membership revenue from active subscriptions
    SELECT COALESCE(SUM(
        CASE 
            WHEN ss.price_id = 'price_gold_monthly' THEN 34.99
            WHEN ss.price_id = 'price_platinum_monthly' THEN 59.99
            WHEN ss.price_id = 'price_ultimate_monthly' THEN 499.99
            ELSE 0
        END
    ), 0) INTO total_membership_revenue
    FROM stripe_subscriptions ss
    JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
    JOIN profiles p ON sc.user_id = p.id
    WHERE ss.status = 'active'
      AND to_timestamp(ss.current_period_end) >= month_date
      AND to_timestamp(ss.current_period_start) < month_date + INTERVAL '1 month';
    
    -- Calculate producer bucket (45% of total membership revenue)
    producer_bucket_total := total_membership_revenue * 0.45;
    
    -- Calculate total monthly sales for active producers
    SELECT COALESCE(SUM(pt.amount), 0) INTO total_monthly_sales
    FROM producer_transactions pt
    WHERE pt.type = 'sale'
      AND pt.created_at >= DATE_TRUNC('month', month_date)
      AND pt.created_at < DATE_TRUNC('month', month_date) + INTERVAL '1 month';
    
    -- Calculate no sales bucket (2% of producer bucket)
    no_sales_bucket := producer_bucket_total * (settings.no_sales_bucket_rate / 100.0);
    
    -- Count active uploaders (those who have uploaded in the last 90 days)
    SELECT COUNT(*) INTO active_uploaders_count
    FROM profiles p
    WHERE p.account_type IN ('producer', 'admin,producer', 'artist_band', 'rights_holder')
      AND has_uploaded_in_last_90_days(p.id);
    
    -- Return distribution for each producer
    RETURN QUERY
    SELECT 
        p.id as producer_id,
        p.email as producer_email,
        CONCAT(p.first_name, ' ', p.last_name) as producer_name,
        COALESCE(current_month.sales, 0) as monthly_sales,
        COALESCE(previous_month.sales, 0) as previous_month_sales,
        CASE 
            WHEN COALESCE(previous_month.sales, 0) > 0 
            THEN ((COALESCE(current_month.sales, 0) - COALESCE(previous_month.sales, 0)) / COALESCE(NULLIF(previous_month.sales, 0), 1)) * 100
            ELSE 0
        END as growth_percentage,
        CASE 
            WHEN COALESCE(current_month.sales, 0) > 0 AND total_monthly_sales > 0
            THEN (COALESCE(current_month.sales, 0) / total_monthly_sales) * (producer_bucket_total - no_sales_bucket)
            ELSE 0
        END as membership_share,
        CASE 
            WHEN COALESCE(current_month.sales, 0) > 0 
            AND COALESCE(previous_month.sales, 0) > 0
            AND ((COALESCE(current_month.sales, 0) - COALESCE(previous_month.sales, 0)) / COALESCE(NULLIF(previous_month.sales, 0), 1)) > 0.1
            AND total_monthly_sales > 0
            THEN (COALESCE(current_month.sales, 0) / total_monthly_sales) * (producer_bucket_total * (settings.growth_bonus_rate / 100.0))
            ELSE 0
        END as growth_bonus,
        CASE 
            WHEN COALESCE(current_month.sales, 0) = 0 
            AND has_uploaded_in_last_90_days(p.id)
            AND active_uploaders_count > 0
            THEN no_sales_bucket / active_uploaders_count
            ELSE 0
        END as no_sale_bonus,
        CASE 
            WHEN COALESCE(current_month.sales, 0) > 0 AND total_monthly_sales > 0
            THEN (COALESCE(current_month.sales, 0) / total_monthly_sales) * (producer_bucket_total - no_sales_bucket)
            ELSE 0
        END + 
        CASE 
            WHEN COALESCE(current_month.sales, 0) > 0 
            AND COALESCE(previous_month.sales, 0) > 0
            AND ((COALESCE(current_month.sales, 0) - COALESCE(previous_month.sales, 0)) / COALESCE(NULLIF(previous_month.sales, 0), 1)) > 0.1
            AND total_monthly_sales > 0
            THEN (COALESCE(current_month.sales, 0) / total_monthly_sales) * (producer_bucket_total * (settings.growth_bonus_rate / 100.0))
            ELSE 0
        END +
        CASE 
            WHEN COALESCE(current_month.sales, 0) = 0 
            AND has_uploaded_in_last_90_days(p.id)
            AND active_uploaders_count > 0
            THEN no_sales_bucket / active_uploaders_count
            ELSE 0
        END as total_membership_earnings,
        has_uploaded_in_last_90_days(p.id) as has_recent_upload
    FROM profiles p
    LEFT JOIN (
        SELECT 
            pt.transaction_producer_id,
            SUM(pt.amount) as sales
        FROM producer_transactions pt
        WHERE pt.type = 'sale'
          AND pt.created_at >= DATE_TRUNC('month', month_date)
          AND pt.created_at < DATE_TRUNC('month', month_date) + INTERVAL '1 month'
        GROUP BY pt.transaction_producer_id
    ) current_month ON p.id = current_month.transaction_producer_id
    LEFT JOIN (
        SELECT 
            pt.transaction_producer_id,
            SUM(pt.amount) as sales
        FROM producer_transactions pt
        WHERE pt.type = 'sale'
          AND pt.created_at >= DATE_TRUNC('month', month_date) - INTERVAL '1 month'
          AND pt.created_at < DATE_TRUNC('month', month_date)
        GROUP BY pt.transaction_producer_id
    ) previous_month ON p.id = previous_month.transaction_producer_id
    WHERE p.account_type IN ('producer', 'admin,producer', 'artist_band', 'rights_holder')
    ORDER BY total_membership_earnings DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update the distribute_membership_revenue function to exclude inactive uploaders
CREATE OR REPLACE FUNCTION distribute_membership_revenue(
    month_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
    settings RECORD;
    total_membership_revenue NUMERIC;
    producer_bucket_total NUMERIC;
    total_monthly_sales NUMERIC;
    no_sales_bucket NUMERIC;
    producer_record RECORD;
    producer_share NUMERIC;
    growth_bonus NUMERIC;
    no_sale_bonus NUMERIC;
    total_producers INTEGER;
    active_producers INTEGER;
    inactive_producers INTEGER;
    active_uploaders_count INTEGER;
BEGIN
    -- Get compensation settings
    SELECT * INTO settings FROM compensation_settings WHERE id = 1;
    
    -- Calculate total membership revenue from active subscriptions
    SELECT COALESCE(SUM(
        CASE 
            WHEN ss.price_id = 'price_gold_monthly' THEN 34.99
            WHEN ss.price_id = 'price_platinum_monthly' THEN 59.99
            WHEN ss.price_id = 'price_ultimate_monthly' THEN 499.99
            ELSE 0
        END
    ), 0) INTO total_membership_revenue
    FROM stripe_subscriptions ss
    JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
    JOIN profiles p ON sc.user_id = p.id
    WHERE ss.status = 'active'
      AND to_timestamp(ss.current_period_end) >= month_date
      AND to_timestamp(ss.current_period_start) < month_date + INTERVAL '1 month';
    
    -- Calculate producer bucket (45% of total membership revenue)
    producer_bucket_total := total_membership_revenue * 0.45;
    
    -- Calculate total monthly sales for active producers
    SELECT COALESCE(SUM(pt.amount), 0) INTO total_monthly_sales
    FROM producer_transactions pt
    WHERE pt.type = 'sale'
      AND pt.created_at >= DATE_TRUNC('month', month_date)
      AND pt.created_at < DATE_TRUNC('month', month_date) + INTERVAL '1 month';
    
    -- Calculate the number of producers
    SELECT COUNT(*) INTO total_producers
    FROM profiles p
    WHERE p.account_type IN ('producer', 'admin,producer', 'artist_band', 'rights_holder');
    
    -- Calculate active producers (those with sales in the last month)
    SELECT COUNT(DISTINCT pt.transaction_producer_id) INTO active_producers
    FROM producer_transactions pt
    WHERE pt.type = 'sale'
      AND pt.created_at >= DATE_TRUNC('month', month_date)
      AND pt.created_at < DATE_TRUNC('month', month_date) + INTERVAL '1 month';
    
    -- Calculate inactive producers
    inactive_producers := total_producers - active_producers;
    
    -- Count active uploaders (those who have uploaded in the last 90 days)
    SELECT COUNT(*) INTO active_uploaders_count
    FROM profiles p
    WHERE p.account_type IN ('producer', 'admin,producer', 'artist_band', 'rights_holder')
      AND has_uploaded_in_last_90_days(p.id);
    
    -- Calculate no sales bucket (2% of producer bucket)
    no_sales_bucket := producer_bucket_total * (settings.no_sales_bucket_rate / 100.0);
    
    -- Distribute to each producer
    FOR producer_record IN 
        SELECT 
            p.id AS producer_id,
            COALESCE(current_month.sales, 0) AS monthly_sales,
            COALESCE(previous_month.sales, 0) AS previous_month_sales
        FROM profiles p
        LEFT JOIN (
            SELECT 
                pt.transaction_producer_id,
                SUM(pt.amount) as sales
            FROM producer_transactions pt
            WHERE pt.type = 'sale'
              AND pt.created_at >= DATE_TRUNC('month', month_date)
              AND pt.created_at < DATE_TRUNC('month', month_date) + INTERVAL '1 month'
            GROUP BY pt.transaction_producer_id
        ) current_month ON p.id = current_month.transaction_producer_id
        LEFT JOIN (
            SELECT 
                pt.transaction_producer_id,
                SUM(pt.amount) as sales
            FROM producer_transactions pt
            WHERE pt.type = 'sale'
              AND pt.created_at >= DATE_TRUNC('month', month_date) - INTERVAL '1 month'
              AND pt.created_at < DATE_TRUNC('month', month_date)
            GROUP BY pt.transaction_producer_id
        ) previous_month ON p.id = previous_month.transaction_producer_id
        WHERE p.account_type IN ('producer', 'admin,producer', 'artist_band', 'rights_holder')
    LOOP
        -- Calculate base share for this producer
        IF producer_record.monthly_sales > 0 THEN
            -- Active producer - gets share based on sales performance
            producer_share := (producer_record.monthly_sales / total_monthly_sales) * (producer_bucket_total - no_sales_bucket);
            
            -- Check for growth bonus (10% growth threshold)
            IF producer_record.monthly_sales > producer_record.previous_month_sales 
               AND ((producer_record.monthly_sales - producer_record.previous_month_sales) / NULLIF(producer_record.previous_month_sales, 0)) > 0.1 THEN
                growth_bonus := producer_share * (settings.growth_bonus_rate / 100.0);
                producer_share := producer_share + growth_bonus;
            ELSE
                growth_bonus := 0;
            END IF;
        ELSE
            -- Inactive producer - only gets share from no sales bucket if they have uploaded in last 90 days
            IF has_uploaded_in_last_90_days(producer_record.producer_id) AND active_uploaders_count > 0 THEN
                producer_share := no_sales_bucket / active_uploaders_count;
                
                -- Add no sale bonus
                no_sale_bonus := producer_share * (settings.no_sale_bonus_rate / 100.0);
                producer_share := producer_share + no_sale_bonus;
            ELSE
                -- No recent upload - no share from the bucket
                producer_share := 0;
                no_sale_bonus := 0;
            END IF;
        END IF;
        
        -- Only create transaction if producer_share > 0
        IF producer_share > 0 THEN
            -- Update producer balance
            INSERT INTO producer_balances (producer_id, available_balance, pending_balance, lifetime_earnings)
            VALUES (producer_record.producer_id, 0, producer_share, producer_share)
            ON CONFLICT (producer_id) DO UPDATE
            SET 
                pending_balance = producer_balances.pending_balance + EXCLUDED.pending_balance,
                lifetime_earnings = producer_balances.lifetime_earnings + EXCLUDED.lifetime_earnings,
                updated_at = now();
            
            -- Create transaction record
            INSERT INTO producer_transactions (
                producer_id,
                amount,
                type,
                status,
                description,
                created_at
            ) VALUES (
                producer_record.producer_id,
                producer_share,
                'membership_share',
                'completed',
                'Membership Revenue Share: ' || to_char(month_date, 'Month YYYY'),
                now()
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a view to show upload status for all users
CREATE OR REPLACE VIEW user_upload_status AS
SELECT 
    p.id,
    p.email,
    CONCAT(p.first_name, ' ', p.last_name) as full_name,
    p.account_type,
    CASE 
        WHEN p.account_type IN ('producer', 'admin,producer') THEN 'Producer'
        WHEN p.account_type = 'artist_band' THEN 'Artist'
        WHEN p.account_type = 'rights_holder' THEN 'Rights Holder'
        ELSE p.account_type
    END as user_type,
    has_uploaded_in_last_90_days(p.id) as has_recent_upload,
    CASE 
        WHEN has_uploaded_in_last_90_days(p.id) THEN 'Active Uploader'
        ELSE 'Inactive Uploader (No upload in 90 days)'
    END as upload_status,
    (
        SELECT MAX(created_at) 
        FROM tracks 
        WHERE track_producer_id = p.id 
          AND deleted_at IS NULL
    ) as last_upload_date,
    (
        SELECT COUNT(*) 
        FROM tracks 
        WHERE track_producer_id = p.id 
          AND deleted_at IS NULL
    ) as total_tracks
FROM profiles p
WHERE p.account_type IN ('producer', 'admin,producer', 'artist_band', 'rights_holder')
ORDER BY p.account_type, has_recent_upload DESC, last_upload_date DESC;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION has_uploaded_in_last_90_days(UUID) TO authenticated;
GRANT SELECT ON user_upload_status TO authenticated;

-- 6. Add comments for documentation
COMMENT ON FUNCTION has_uploaded_in_last_90_days(UUID) IS 'Checks if a user has uploaded a track in the last 90 days';
COMMENT ON VIEW user_upload_status IS 'Shows upload status for all producers, artists, and rights holders';
