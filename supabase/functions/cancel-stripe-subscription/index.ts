import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://mybeatfi.io',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Look up Stripe customer
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (customerError || !customer?.customer_id) {
      return new Response(JSON.stringify({ error: 'Stripe customer not found' }), { status: 404 });
    }
    const customerId = customer.customer_id;

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    if (!subscriptions.data.length) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), { status: 404 });
    }
    const subscription = subscriptions.data[0];

    // Cancel the subscription at period end
    const canceled = await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });

    // Update DB (optional: set status to 'cancelling' or similar)
    await supabase
      .from('stripe_subscriptions')
      .update({ status: 'cancelling', cancel_at_period_end: true })
      .eq('subscription_id', subscription.id);

    // Update user's profile with pending downgrade info
    await supabase
      .from('profiles')
      .update({
        subscription_cancel_at_period_end: true,
        subscription_current_period_end: new Date(canceled.current_period_end * 1000).toISOString()
      })
      .eq('id', user.id);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}); 