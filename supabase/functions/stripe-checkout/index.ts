import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  // For 204 No Content, don't include Content-Type or body
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
  console.log('🔍 Checkout Debug: Function called');
  
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { price_id, success_url, cancel_url, mode, metadata = {}, custom_amount } = await req.json();

    // Validate required parameters
    if (!price_id || !success_url || !cancel_url || !mode) {
      return corsResponse({ error: 'Missing required parameters' }, 400);
    }

    if (!['payment', 'subscription'].includes(mode)) {
      return corsResponse({ error: 'Invalid mode' }, 400);
    }

    console.log(`Creating checkout session for price_id: ${price_id}, mode: ${mode}`);

    // Create a test customer for testing purposes
    const testCustomer = await stripe.customers.create({
      email: 'test@example.com',
      metadata: {
        test: 'true',
        timestamp: new Date().toISOString()
      },
    });

    console.log(`Created test customer: ${testCustomer.id}`);

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      customer: testCustomer.id,
      line_items: custom_amount ? [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: metadata.description || 'Custom Payment',
            },
            unit_amount: custom_amount,
          },
          quantity: 1,
        },
      ] : [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode,
      success_url,
      cancel_url,
      metadata: {
        ...metadata,
        test: 'true',
        customer_id: testCustomer.id
      },
      allow_promotion_codes: true,
    });

    console.log(`Created checkout session: ${session.id}`);

    return corsResponse({ 
      sessionId: session.id, 
      url: session.url,
      customerId: testCustomer.id,
      test: true
    });

  } catch (error: any) {
    console.error(`Checkout error: ${error.message}`);
    console.error(`Error details:`, error);
    return corsResponse({ error: error.message }, 500);
  }
});