import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Stripe secret keys from environment
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

// Stripe API base URL
const STRIPE_API_BASE = 'https://api.stripe.com/v1';

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
};

// Helper: Convert ArrayBuffer to string
function ab2str(buf: ArrayBuffer) {
  return new TextDecoder().decode(buf);
}

// Helper: Timing-safe compare
function safeCompare(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Helper: Verify Stripe signature (Deno-compatible)
async function verifyStripeSignature(
  rawBody: ArrayBuffer,
  sigHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!sigHeader) return false;
  const [timestampPart, signaturePart] = sigHeader.split(',').map((s) => s.trim());
  const timestamp = timestampPart.split('=')[1];
  const signature = signaturePart.split('=')[1];
  const signedPayload = `${timestamp}.${ab2str(rawBody)}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedPayload)
  );
  const expectedSignature = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return safeCompare(signature, expectedSignature);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // 1. Get raw body and signature
  const rawBody = await req.arrayBuffer();
  const sigHeader = req.headers.get('stripe-signature');

  // 2. Verify signature
  let isValid = false;
  try {
    isValid = await verifyStripeSignature(rawBody, sigHeader, stripeWebhookSecret);
  } catch (err) {
    console.error('Signature verification error:', err);
    return new Response('Webhook signature verification failed', { status: 400, headers: corsHeaders });
  }
  if (!isValid) {
    console.error('Webhook signature verification failed: Invalid signature');
    return new Response('Webhook signature verification failed', { status: 400, headers: corsHeaders });
  }

  // 3. Parse event
  let event;
  try {
    event = JSON.parse(ab2str(rawBody));
  } catch (err) {
    console.error('Invalid JSON:', err);
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
  }

  // 4. Handle event
  try {
    await handleEvent(event);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

async function handleEvent(event: any) {
  const stripeData = event?.data?.object ?? {};
  if (!stripeData || !('customer' in stripeData)) return;

  const { customer: customerId } = stripeData;
  if (!customerId || typeof customerId !== 'string') {
    console.error(`Invalid customer in event: ${JSON.stringify(event)}`);
    return;
  }

  const { mode, payment_status } = stripeData;

  if (event.type === 'checkout.session.completed') {
    const isSubscription = mode === 'subscription';

    console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout`);

    if (isSubscription) {
      await syncCustomerFromStripe(customerId);
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        const {
          id: checkout_session_id,
          payment_intent,
          amount_total,
          metadata,
        } = stripeData;

        const { data: customerData, error: customerError } = await supabase
          .from('stripe_customers')
          .select('user_id')
          .eq('customer_id', customerId)
          .single();

        if (customerError || !customerData?.user_id) {
          console.error('Error fetching stripe customer user_id:', customerError);
          return;
        }

        // Sanitize metadata to avoid column conflicts
        const safeMetadata = { ...metadata };
        delete safeMetadata.producer_id;
        delete safeMetadata.id;
        delete safeMetadata.status;

        // === Track Purchase ===
        const trackId = safeMetadata?.track_id;

        if (trackId && customerData?.user_id) {
          const { data: trackData, error: trackError } = await supabase
            .from('tracks')
            .select('id, track_producer_id')
            .eq('id', trackId)
            .single();

          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', customerData.user_id)
            .single();

          if (trackError || profileError) {
            console.error('Track or profile fetch failed', trackError || profileError);
            return;
          }

          const { error: saleError } = await supabase.from('sales').insert({
            track_id: trackData.id,
            sale_producer_id: trackData.track_producer_id,
            buyer_id: customerData.user_id,
            license_type: 'Single Track',
            amount: amount_total / 100,
            payment_method: 'stripe',
            transaction_id: payment_intent,
            created_at: new Date().toISOString(),
            licensee_info: {
              name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
              email: profileData.email,
            },
            ...safeMetadata,
          });

          if (saleError) {
            console.error('Error inserting sale record:', saleError);
            return;
          }

          console.info(`License record created for track ${trackId}`);
        }

        console.info(`One-time payment processed for session ${checkout_session_id}`);
      } catch (err) {
        console.error('One-time payment handler failed:', err);
      }
    }
  } else {
    console.log(`Ignoring unsupported event type: ${event.type}`);
  }
}

async function syncCustomerFromStripe(customerId: string) {
  // Use Stripe HTTP API directly for subscriptions
  const res = await fetch(`${STRIPE_API_BASE}/subscriptions?customer=${customerId}&limit=1&status=all&expand[]=data.default_payment_method`, {
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
    },
  });
  const subscriptions = await res.json();

  if (!subscriptions.data || subscriptions.data.length === 0) {
    const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_status: 'not_started',
      },
      { onConflict: 'customer_id' }
    );

    if (noSubError) throw new Error('No active subscriptions and failed to upsert status');
    console.info(`No active subscriptions for customer ${customerId}`);
    return;
  }

  const subscription = subscriptions.data[0];

  const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
    {
      customer_id: customerId,
      subscription_id: subscription.id,
      price_id: subscription.items.data[0].price.id,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      payment_method_brand: subscription.default_payment_method?.card?.brand ?? null,
      payment_method_last4: subscription.default_payment_method?.card?.last4 ?? null,
      subscription_status: subscription.status,
    },
    { onConflict: 'customer_id' }
  );

  if (subError) throw new Error('Failed to upsert subscription');
  console.info(`Subscription synced for customer ${customerId}`);
}
