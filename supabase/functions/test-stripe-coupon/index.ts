import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.7.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-12-18.acacia',
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { discount_id } = await req.json()

    console.log('Test function called with discount_id:', discount_id)

    // Get the discount
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
      end_date: discount.end_date
    })

    // Test with hardcoded values first
    console.log('Testing with hardcoded values...')
    
    try {
      const testCoupon = await stripe.coupons.create({
        id: 'test-coupon-' + Date.now(),
        name: 'Test Coupon',
        percent_off: 25,
        duration: 'once'
      })
      console.log('✅ Test coupon created successfully:', testCoupon.id)
    } catch (testError) {
      console.error('❌ Test coupon creation failed:', testError)
      return new Response(
        JSON.stringify({ error: 'Test coupon creation failed', details: testError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Now test with actual discount data
    console.log('Testing with actual discount data...')
    
    const percentOff = Math.round(Number(discount.discount_percent))
    console.log('Calculated percent_off:', percentOff, 'Type:', typeof percentOff)

    try {
      const coupon = await stripe.coupons.create({
        id: discount.promotion_code,
        name: discount.name,
        percent_off: percentOff,
        duration: 'once'
      })
      console.log('✅ Actual coupon created successfully:', coupon.id)
      
      return new Response(
        JSON.stringify({ success: true, coupon_id: coupon.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (stripeError) {
      console.error('❌ Actual coupon creation failed:', stripeError)
      return new Response(
        JSON.stringify({ error: 'Stripe coupon creation failed', details: stripeError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 