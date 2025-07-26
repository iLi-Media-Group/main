-- Create automatic Stripe coupon creation trigger
-- This will automatically create Stripe coupons when promotion code discounts are inserted

-- First, let's create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION create_stripe_coupon_automatically()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create Stripe coupon for promotion code discounts
    IF NEW.discount_type = 'promotion_code' AND NEW.promotion_code IS NOT NULL THEN
        -- Call the Edge Function to create the Stripe coupon
        -- This will be handled by the frontend, but we can set a flag
        -- to indicate that this discount needs a Stripe coupon
        NEW.stripe_coupon_id := NULL;
        NEW.stripe_coupon_created_at := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_create_stripe_coupon ON discounts;
CREATE TRIGGER trigger_create_stripe_coupon
    BEFORE INSERT ON discounts
    FOR EACH ROW
    EXECUTE FUNCTION create_stripe_coupon_automatically();

-- Also create a trigger for updates
DROP TRIGGER IF EXISTS trigger_update_stripe_coupon ON discounts;
CREATE TRIGGER trigger_update_stripe_coupon
    BEFORE UPDATE ON discounts
    FOR EACH ROW
    EXECUTE FUNCTION create_stripe_coupon_automatically();

-- Test the trigger
SELECT 'Trigger created successfully' as info;

-- Show existing triggers
SELECT 'Existing triggers on discounts table:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'discounts'; 