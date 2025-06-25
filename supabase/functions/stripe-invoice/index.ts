import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': 'https://mybeatfi.io',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
  if (status === 204) {
    return new Response(null, { status, headers });
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }
    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }
    const { proposal_id, amount, client_user_id, payment_due_date, metadata = {} } = await req.json();
    if (!proposal_id || !amount || !client_user_id) {
      return corsResponse({ error: 'Missing required parameters' }, 400);
    }
    // Look up or create Stripe customer for client_user_id
    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', client_user_id)
      .is('deleted_at', null)
      .maybeSingle();
    let customerId;
    if (getCustomerError) {
      console.error('Failed to fetch customer info', getCustomerError);
      return corsResponse({ error: 'Failed to fetch customer info' }, 500);
    }
    if (!customer || !customer.customer_id) {
      // Fetch client email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', client_user_id)
        .maybeSingle();
      if (profileError || !profile?.email) {
        return corsResponse({ error: 'Could not find client email' }, 400);
      }
      const newCustomer = await stripe.customers.create({
        email: profile.email,
        metadata: { userId: client_user_id },
      });
      await supabase.from('stripe_customers').insert({
        user_id: client_user_id,
        customer_id: newCustomer.id,
      });
      customerId = newCustomer.id;
    } else {
      customerId = customer.customer_id;
    }
    // Create a product/price for the proposal
    const product = await stripe.products.create({
      name: metadata.description || `Sync Proposal #${proposal_id}`,
      metadata: { proposal_id },
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount,
      currency: 'usd',
    });
    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: metadata.success_url || `${Deno.env.get('SITE_URL')}/dashboard?payment=success`,
      cancel_url: metadata.cancel_url || `${Deno.env.get('SITE_URL')}/dashboard?payment=cancel`,
      metadata: {
        proposal_id,
        ...metadata,
      },
      expires_at: payment_due_date ? Math.floor(new Date(payment_due_date).getTime() / 1000) + 86400 : undefined, // Optionally set session expiry
    });
    return corsResponse({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe invoice function error:', error.message);
    return corsResponse({ error: error.message }, 500);
  }
}); 