import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if today is the 10th of the month
    const today = new Date()
    const isPayoutDay = today.getDate() === 10

    if (!isPayoutDay) {
      return new Response(
        JSON.stringify({ 
          message: 'Not payout day. Payouts only processed on the 10th of each month.',
          currentDate: today.toISOString(),
          isPayoutDay 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log('Processing monthly payouts...')

    // 1. Get all producers with available balance (previous months transactions)
    const { data: producers, error: producersError } = await supabase
      .from('producer_balances')
      .select(`
        balance_producer_id,
        available_balance,
        profiles!inner(
          id,
          first_name,
          last_name,
          email,
          account_type
        )
      `)
      .gt('available_balance', 0)

    if (producersError) {
      console.error('Error fetching producers:', producersError)
      throw producersError
    }

    console.log(`Found ${producers?.length || 0} producers with available balance`)

    const payoutResults = []

    for (const producer of producers || []) {
      try {
        const producerId = producer.balance_producer_id
        const availableBalance = producer.available_balance
        const profile = producer.profiles

        console.log(`Processing payout for ${profile.email}: $${availableBalance}`)

        // 2. Get payment methods for this producer
        const { data: paymentMethods, error: paymentError } = await supabase
          .from('producer_payment_methods')
          .select('*')
          .eq('payment_method_producer_id', producerId)
          .eq('is_primary', true)
          .limit(1)

        if (paymentError) {
          console.error(`Error fetching payment methods for ${profile.email}:`, paymentError)
          continue
        }

        if (!paymentMethods || paymentMethods.length === 0) {
          console.log(`No primary payment method found for ${profile.email}`)
          payoutResults.push({
            producer: profile.email,
            status: 'skipped',
            reason: 'No primary payment method'
          })
          continue
        }

        const paymentMethod = paymentMethods[0]

        // 3. Create payout record
        const { data: payoutRecord, error: payoutError } = await supabase
          .from('producer_payouts')
          .insert({
            payout_producer_id: producerId,
            amount: availableBalance,
            payment_method_id: paymentMethod.id,
            status: 'pending',
            payout_date: new Date().toISOString(),
            description: `Monthly payout for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          })
          .select()
          .single()

        if (payoutError) {
          console.error(`Error creating payout record for ${profile.email}:`, payoutError)
          payoutResults.push({
            producer: profile.email,
            status: 'error',
            reason: 'Failed to create payout record'
          })
          continue
        }

        // 4. Update transaction status from 'pending' to 'completed' for previous months
        const { error: updateError } = await supabase
          .from('producer_transactions')
          .update({ status: 'completed' })
          .eq('transaction_producer_id', producerId)
          .eq('type', 'sale')
          .eq('status', 'pending')
          .lt('created_at', new Date(today.getFullYear(), today.getMonth(), 1).toISOString())

        if (updateError) {
          console.error(`Error updating transactions for ${profile.email}:`, updateError)
          payoutResults.push({
            producer: profile.email,
            status: 'error',
            reason: 'Failed to update transactions'
          })
          continue
        }

        // 5. Reset available balance to 0 (since it's being paid out)
        const { error: balanceError } = await supabase
          .from('producer_balances')
          .update({ available_balance: 0 })
          .eq('balance_producer_id', producerId)

        if (balanceError) {
          console.error(`Error updating balance for ${profile.email}:`, balanceError)
          payoutResults.push({
            producer: profile.email,
            status: 'error',
            reason: 'Failed to update balance'
          })
          continue
        }

        // 6. Here you would integrate with Stripe to actually process the payout
        // For now, we'll just mark it as processed
        const { error: stripeError } = await supabase
          .from('producer_payouts')
          .update({ 
            status: 'processed',
            processed_at: new Date().toISOString()
          })
          .eq('id', payoutRecord.id)

        if (stripeError) {
          console.error(`Error updating payout status for ${profile.email}:`, stripeError)
        }

        console.log(`Successfully processed payout for ${profile.email}: $${availableBalance}`)
        payoutResults.push({
          producer: profile.email,
          status: 'success',
          amount: availableBalance,
          payoutId: payoutRecord.id
        })

      } catch (error) {
        console.error(`Error processing payout for producer ${producer.balance_producer_id}:`, error)
        payoutResults.push({
          producer: producer.profiles?.email || 'Unknown',
          status: 'error',
          reason: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Monthly payout processing completed',
        date: today.toISOString(),
        totalProducers: producers?.length || 0,
        results: payoutResults
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in monthly payout processing:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to process monthly payouts'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 