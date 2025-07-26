import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.12.1?target=deno'

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
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-12-18.acacia',
    })

    // Initialize Supabase with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const { discount_id } = await req.json()

    if (!discount_id) {
      return new Response(
        JSON.stringify({ error: 'discount_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the discount from database
    const { data: discount, error: discountError } = await supabase
      .from('discounts')
      .select('*')
      .eq('id', discount_id)
      .single()

    if (discountError || !discount) {
      return new Response(
        JSON.stringify({ error: 'Discount not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only create Stripe coupon for promotion code discounts
    if (discount.discount_type !== 'promotion_code' || !discount.promotion_code) {
      return new Response(
        JSON.stringify({ error: 'Only promotion code discounts can create Stripe coupons' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Creating Stripe coupon for discount: ${discount.name}`)

    // Calculate expiration date
    const redeemBy = new Date(discount.end_date)
    const redeemByTimestamp = Math.floor(redeemBy.getTime() / 1000)

    // Create Stripe coupon
    const coupon = await stripe.coupons.create({
      id: discount.promotion_code,
      name: discount.name,
      percent_off: discount.discount_percent,
      duration: 'once',
      duration_in_months: null,
      max_redemptions: null, // Unlimited
      redeem_by: redeemByTimestamp,
      metadata: {
        description: discount.description,
        applies_to: discount.applies_to.join(','),
        discount_id: discount.id
      }
    })

    console.log(`✅ Created Stripe coupon: ${coupon.id}`)

    // Update the discount record with Stripe coupon info
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
    }

    return new Response(
      JSON.stringify({
        success: true,
        coupon_id: coupon.id,
        coupon_name: coupon.name,
        percent_off: coupon.percent_off,
        redeem_by: coupon.redeem_by
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating Stripe coupon:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 