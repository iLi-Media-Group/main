import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.7.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== CREATE STRIPE COUPON FUNCTION STARTED ===')
    
    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    console.log('Stripe key exists:', !!stripeKey)
    
    const stripe = new Stripe(stripeKey ?? '', {
      apiVersion: '2024-12-18.acacia',
    })

    // Initialize Supabase with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    console.log('Supabase URL exists:', !!supabaseUrl)
    console.log('Supabase service key exists:', !!supabaseServiceKey)
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const body = await req.json()
    console.log('Request body:', body)
    
    const { discount_id } = body

    if (!discount_id) {
      console.error('No discount_id provided')
      return new Response(
        JSON.stringify({ error: 'discount_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Looking for discount with ID:', discount_id)

    // Get the discount from database
    const { data: discount, error: discountError } = await supabase
      .from('discounts')
      .select('*')
      .eq('id', discount_id)
      .single()

    if (discountError || !discount) {
      console.error('Discount not found:', discountError)
      return new Response(
        JSON.stringify({ error: 'Discount not found', details: discountError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found discount:', {
      id: discount.id,
      name: discount.name,
      discount_type: discount.discount_type,
      promotion_code: discount.promotion_code,
      discount_percent: discount.discount_percent,
      discount_percent_type: typeof discount.discount_percent,
      end_date: discount.end_date,
      end_date_type: typeof discount.end_date
    })

    // Only create Stripe coupon for promotion code discounts
    if (discount.discount_type !== 'promotion_code' || !discount.promotion_code) {
      console.error('Invalid discount type or missing promotion code')
      return new Response(
        JSON.stringify({ error: 'Only promotion code discounts can create Stripe coupons' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Creating Stripe coupon for discount: ${discount.name}`)

    // Calculate expiration date - handle null/invalid dates
    let redeemByTimestamp = null
    if (discount.end_date) {
      try {
        console.log('Processing end_date:', discount.end_date)
        
        // Handle different date formats
        let redeemBy: Date
        if (typeof discount.end_date === 'string') {
          redeemBy = new Date(discount.end_date)
        } else {
          redeemBy = new Date(discount.end_date)
        }
        
        console.log('Parsed date:', redeemBy)
        console.log('Date is valid:', !isNaN(redeemBy.getTime()))
        
        if (!isNaN(redeemBy.getTime())) {
          redeemByTimestamp = Math.floor(redeemBy.getTime() / 1000)
          console.log('Calculated redeem_by timestamp:', redeemByTimestamp)
        } else {
          console.error('Invalid end_date:', discount.end_date)
        }
      } catch (error) {
        console.error('Error parsing end_date:', error, 'end_date:', discount.end_date)
      }
    } else {
      console.log('No end_date provided, setting redeem_by to null')
    }

    // Create Stripe coupon
    // Ensure percent_off is a valid integer between 1-100
    console.log('Processing discount_percent:', discount.discount_percent)
    const percentOff = Math.round(Number(discount.discount_percent))
    console.log('Calculated percentOff:', percentOff, 'Type:', typeof percentOff)
    
    if (isNaN(percentOff) || percentOff < 1 || percentOff > 100) {
      console.error('Invalid percent_off:', percentOff)
      throw new Error(`Invalid discount_percent: ${discount.discount_percent}. Must be between 1-100.`)
    }
    
    // Create coupon data - let Stripe generate the ID
    const couponData = {
      name: discount.name,
      percent_off: percentOff,
      duration: discount.duration_type || 'once', // Use configured duration
      duration_in_months: discount.duration_type === 'repeating' ? (discount.duration_in_months || 12) : undefined,
      max_redemptions: discount.max_redemptions || null, // Use configured max redemptions
      redeem_by: redeemByTimestamp, // Will be null if no valid end_date
      metadata: {
        description: discount.description || '',
        applies_to: Array.isArray(discount.applies_to) ? discount.applies_to.join(',') : '',
        discount_id: discount.id,
        promotion_code: discount.promotion_code, // Store our promotion code in metadata
        duration_type: discount.duration_type,
        max_redemptions: discount.max_redemptions?.toString() || 'unlimited',
        max_redemptions_per_customer: discount.max_redemptions_per_customer?.toString() || 'unlimited'
      }
    }
    
    console.log('Creating Stripe coupon with data:', couponData)

    let coupon: any = null
    try {
      console.log('Calling stripe.coupons.create...')
      coupon = await stripe.coupons.create(couponData)
      console.log(`✅ Created Stripe coupon: ${coupon.id}`)
      console.log('Coupon details:', {
        id: coupon.id,
        name: coupon.name,
        percent_off: coupon.percent_off,
        redeem_by: coupon.redeem_by
      })
    } catch (stripeError: any) {
      console.error('Stripe coupon creation failed:', stripeError)
      console.error('Stripe error message:', stripeError.message)
      console.error('Stripe error type:', stripeError.type)
      console.error('Stripe error code:', stripeError.code)
      throw new Error(`Stripe coupon creation failed: ${stripeError.message}`)
    }

    // Update the discount record with Stripe coupon info
    console.log('Updating discount record with Stripe coupon info...')
    const { error: updateError } = await supabase
      .from('discounts')
      .update({
        stripe_coupon_id: coupon.id,
        stripe_coupon_created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', discount_id)

    if (updateError) {
      console.error('Error updating discount with Stripe coupon info:', updateError)
    } else {
      console.log('✅ Successfully updated discount record')
    }

    console.log('=== CREATE STRIPE COUPON FUNCTION COMPLETED SUCCESSFULLY ===')

    return new Response(
      JSON.stringify({
        success: true,
        coupon_id: coupon.id,
        coupon_name: coupon.name,
        percent_off: coupon.percent_off,
        redeem_by: coupon.redeem_by,
        promotion_code: discount.promotion_code
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('=== CREATE STRIPE COUPON FUNCTION FAILED ===')
    console.error('Error creating Stripe coupon:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 