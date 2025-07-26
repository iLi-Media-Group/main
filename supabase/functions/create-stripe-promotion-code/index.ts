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
    console.log('=== CREATE STRIPE PROMOTION CODE FUNCTION STARTED ===')
    
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
      stripe_coupon_id: discount.stripe_coupon_id
    })

    // Only create promotion code for promotion code discounts
    if (discount.discount_type !== 'promotion_code' || !discount.promotion_code) {
      console.error('Invalid discount type or missing promotion code')
      return new Response(
        JSON.stringify({ error: 'Only promotion code discounts can create Stripe promotion codes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if we have a Stripe coupon ID
    if (!discount.stripe_coupon_id) {
      console.error('No Stripe coupon ID found for discount')
      return new Response(
        JSON.stringify({ error: 'No Stripe coupon found. Create the coupon first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Creating Stripe promotion code for discount: ${discount.name}`)
    console.log(`Using coupon ID: ${discount.stripe_coupon_id}`)
    console.log(`Promotion code: ${discount.promotion_code}`)

    // Create Stripe promotion code
    try {
      console.log('Calling stripe.promotionCodes.create...')
      const promotionCode = await stripe.promotionCodes.create({
        coupon: discount.stripe_coupon_id,
        code: discount.promotion_code,
        active: true,
        max_redemptions: null, // Unlimited
      })
      
      console.log(`✅ Created Stripe promotion code: ${promotionCode.id}`)
      console.log('Promotion code details:', {
        id: promotionCode.id,
        code: promotionCode.code,
        coupon: promotionCode.coupon,
        active: promotionCode.active
      })

      // Update the discount record with promotion code info
      console.log('Updating discount record with promotion code info...')
      const { error: updateError } = await supabase
        .from('discounts')
        .update({
          stripe_promotion_code_id: promotionCode.id,
          stripe_promotion_code_created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', discount_id)

      if (updateError) {
        console.error('Error updating discount with promotion code info:', updateError)
      } else {
        console.log('✅ Successfully updated discount record')
      }

      console.log('=== CREATE STRIPE PROMOTION CODE FUNCTION COMPLETED SUCCESSFULLY ===')

      return new Response(
        JSON.stringify({
          success: true,
          promotion_code_id: promotionCode.id,
          code: promotionCode.code,
          coupon_id: promotionCode.coupon,
          active: promotionCode.active
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (stripeError: any) {
      console.error('Stripe promotion code creation failed:', stripeError)
      console.error('Stripe error message:', stripeError.message)
      console.error('Stripe error type:', stripeError.type)
      console.error('Stripe error code:', stripeError.code)
      throw new Error(`Stripe promotion code creation failed: ${stripeError.message}`)
    }

  } catch (error) {
    console.error('=== CREATE STRIPE PROMOTION CODE FUNCTION FAILED ===')
    console.error('Error creating Stripe promotion code:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 