import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2022-11-15',
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: corsHeaders,
      status: 405,
    });
  }

  let event;
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      headers: corsHeaders,
      status: 400,
    });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};
    const client_user_id = metadata.client_user_id;
    const track_id = metadata.track_id;
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      if (!session.subscription) {
        // Track license purchase (one-time payment)
        await supabase.from('stripe_user_orders').insert({
          customer_id: session.customer,
          order_id: session.id, // using session.id as order_id
          checkout_session_id: session.id,
          payment_intent_id: session.payment_intent,
          amount_subtotal: session.amount_subtotal,
          amount_total: session.amount_total,
          currency: session.currency,
          payment_status: session.payment_status,
          order_status: 'completed',
          order_date: new Date(session.created * 1000).toISOString(),
        });
        console.log('Inserted order for user:', client_user_id, 'track:', track_id);
      } else {
        // Subscription purchase
        // Fetch subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        // Fetch payment method details from payment intent
        let paymentMethodBrand = null;
        let paymentMethodLast4 = null;
        if (session.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
          if (paymentIntent.payment_method) {
            const pm = typeof paymentIntent.payment_method === 'string'
              ? await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
              : paymentIntent.payment_method;
            paymentMethodBrand = pm.card?.brand || null;
            paymentMethodLast4 = pm.card?.last4 || null;
          }
        }
        await supabase.from('stripe_subscriptions').insert({
          customer_id: session.customer,
          subscription_id: subscription.id,
          price_id: subscription.items.data[0]?.price.id || null,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          payment_method_branf: paymentMethodBrand,
          payment_method_last4: paymentMethodLast4,
          status: subscription.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          user_id: client_user_id,
          pending_plan_effective_date: null,
          pending_plan_name: null,
          plan_name: subscription.items.data[0]?.price.nickname || null,
        });
        console.log('Inserted subscription for user:', client_user_id);
      }
    } catch (dbErr) {
      console.error('DB insert error:', dbErr);
      return new Response(JSON.stringify({ error: 'DB insert error', details: dbErr.message }), {
        headers: corsHeaders,
        status: 500,
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: corsHeaders,
    status: 200,
  });
}); 