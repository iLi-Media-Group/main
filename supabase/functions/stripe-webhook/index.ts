import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const STRIPE_API_BASE = 'https://api.stripe.com/v1';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

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

// Helper: Robust Stripe signature verification (handles multiple signatures, tolerance)
async function verifyStripeSignature(
  rawBody: ArrayBuffer,
  sigHeader: string | null,
  secret: string,
  tolerance = 300 // 5 minutes
): Promise<boolean> {
  if (!sigHeader) return false;
  const parts = sigHeader.split(',').map((s) => s.trim());
  let timestamp = '';
  let signatures: string[] = [];
  for (const part of parts) {
    if (part.startsWith('t=')) timestamp = part.slice(2);
    if (part.startsWith('v1=')) signatures.push(part.slice(3));
  }
  if (!timestamp || signatures.length === 0) return false;
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
  // Check if any signature matches
  const valid = signatures.some((sig) => safeCompare(sig, expectedSignature));
  // Check timestamp tolerance
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > tolerance) return false;
  return valid;
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    const sigHeader = req.headers.get('stripe-signature');
    if (!sigHeader) {
      return new Response('No signature found', { status: 400 });
    }
    const rawBody = await req.arrayBuffer();
    // Verify signature
    let isValid = false;
    try {
      isValid = await verifyStripeSignature(rawBody, sigHeader, stripeWebhookSecret);
    } catch (err) {
      console.error('Signature verification error:', err);
      return new Response('Webhook signature verification failed', { status: 400 });
    }
    if (!isValid) {
      console.error('Webhook signature verification failed: Invalid signature');
      return new Response('Webhook signature verification failed', { status: 400 });
    }
    // Parse event
    let event;
    try {
      event = JSON.parse(ab2str(rawBody));
    } catch (err) {
      console.error('Invalid JSON:', err);
      return new Response('Invalid JSON', { status: 400 });
    }
    // Handle event
    handleEvent(event); // No waitUntil, just fire and forget
    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: any) {
  const stripeData = event?.data?.object ?? {};
  if (!stripeData) return;
  if (!('customer' in stripeData)) return;
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) return;
  const { customer: customerId } = stripeData;
  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
    return;
  }
  let isSubscription = true;
  if (event.type === 'checkout.session.completed') {
    const { mode } = stripeData;
    isSubscription = mode === 'subscription';
    console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
  }
  const { mode, payment_status } = stripeData;
  if (isSubscription) {
    console.info(`Starting subscription sync for customer: ${customerId}`);
    await syncCustomerFromStripe(customerId);
  } else if (mode === 'payment' && payment_status === 'paid') {
    try {
      const {
        id: checkout_session_id,
        payment_intent,
        amount_subtotal,
        amount_total,
        currency,
        metadata
      } = stripeData;
      // Prepare safe order object for stripe_orders
      const safeOrder = {
        checkout_session_id,
        payment_intent_id: payment_intent,
        customer_id: customerId,
        amount_subtotal,
        amount_total,
        currency,
        payment_status,
        status: 'completed'
      };
      if (metadata && typeof metadata === 'object') {
        // Only add metadata if the column exists and is JSONB
        safeOrder.metadata = { ...metadata };
        delete safeOrder.metadata.producer_id;
      }
      const { error: orderError } = await supabase.from('stripe_orders').insert(safeOrder);
      if (orderError) {
        console.error('Error inserting order:', orderError);
        return;
      }
      // Get the user_id associated with this customer
      const { data: customerData, error: customerError } = await supabase
        .from('stripe_customers')
        .select('user_id')
        .eq('customer_id', customerId)
        .single();
      if (customerError) {
        console.error('Error fetching customer data:', customerError);
        return;
      }
      // Check if this is a sync proposal payment
      if (metadata?.proposal_id) {
        const { data: proposalData, error: proposalError } = await supabase
          .from('sync_proposals')
          .select(`id, track_id, client_id, track:tracks!inner (track_producer_id, title)`)
          .eq('id', metadata.proposal_id)
          .single();
        if (proposalError) {
          console.error('Error fetching proposal data:', proposalError);
          return;
        }
        const { error: updateError } = await supabase
          .from('sync_proposals')
          .update({
            payment_status: 'paid',
            payment_date: new Date().toISOString(),
            invoice_id: payment_intent
          })
          .eq('id', metadata.proposal_id);
        if (updateError) {
          console.error('Error updating proposal payment status:', updateError);
          return;
        }
        const { data: producerData, error: producerError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', proposalData.track.track_producer_id)
          .single();
        if (producerError) {
          console.error('Error fetching producer email:', producerError);
          return;
        }
        const { data: clientData, error: clientError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', proposalData.client_id)
          .single();
        if (clientError) {
          console.error('Error fetching client email:', clientError);
          return;
        }
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-proposal-update`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              proposalId: metadata.proposal_id,
              action: 'payment_complete',
              trackTitle: proposalData.track.title,
              producerEmail: producerData.email,
              clientEmail: clientData.email
            })
          });
        } catch (notifyError) {
          console.error('Error sending payment notification:', notifyError);
        }

        // Generate license PDF for the sync proposal
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-sync-license`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              proposal_id: metadata.proposal_id
            })
          });
          console.info(`License PDF generation initiated for proposal: ${metadata.proposal_id}`);
        } catch (licenseError) {
          console.error('Error generating license PDF:', licenseError);
        }

        console.info(`Successfully processed sync proposal payment for proposal: ${metadata.proposal_id}`);
        return;
      }
      // Handle regular track purchase
      const trackId = metadata?.track_id;
      if (trackId && customerData?.user_id) {
        const { data: trackData, error: trackError } = await supabase
          .from('tracks')
          .select('id, track_producer_id')
          .eq('id', trackId)
          .single();
        if (trackError) {
          console.error('Error fetching track data:', trackError);
          return;
        }
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', customerData.user_id)
          .single();
        if (profileError) {
          console.error('Error fetching profile data:', profileError);
          return;
        }
        const { error: saleError } = await supabase
          .from('sales')
          .insert({
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
              email: profileData.email
            }
          });
        if (saleError) {
          console.error('Error creating license record:', saleError);
          return;
        }
        console.info(`Successfully created license record for track ${trackId}`);
      }
      console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
    } catch (error) {
      console.error('Error processing one-time payment:', error);
    }
  }
  // === BEGIN: White Label Feature Activation (Safe Addition) ===
  try {
    if (
      event.type === 'checkout.session.completed' &&
      stripeData?.metadata?.type === 'white_label_setup' &&
      stripeData?.payment_status === 'paid'
    ) {
      const features = (stripeData.metadata.features || '').split(',').map(f => f.trim()).filter(Boolean);
      const email = stripeData.metadata.customer_email;
      const company = stripeData.metadata.company_name || null;
      if (features.length && email) {
        // Find the client by email (or company name as fallback)
        let { data: client, error } = await supabase
          .from('white_label_clients')
          .select('*')
          .ilike('email', email)
          .maybeSingle();
        if (!client && company) {
          // Try by company name if not found by email
          const res = await supabase
            .from('white_label_clients')
            .select('*')
            .ilike('company_name', company)
            .maybeSingle();
          client = res.data;
        }
        if (!client) {
          // Create new client record if not found
          const { data: newClient, error: insertError } = await supabase
            .from('white_label_clients')
            .insert({ email, company_name: company })
            .select('*')
            .single();
          if (insertError) {
            console.error('Error creating white_label_client:', insertError);
            return;
          }
          client = newClient;
        }
        // Prepare update object for paid features
        const paidFields = {};
        if (features.includes('ai_recommendations') || features.includes('ai_search_assistance')) {
          paidFields['ai_search_assistance_paid'] = true;
        }
        if (features.includes('producer_applications') || features.includes('producer_onboarding')) {
          paidFields['producer_onboarding_paid'] = true;
        }
        if (features.includes('deep_media_search')) {
          paidFields['deep_media_search_paid'] = true;
        }
        if (Object.keys(paidFields).length) {
          const { error: updateError } = await supabase
            .from('white_label_clients')
            .update(paidFields)
            .eq('id', client.id);
          if (updateError) {
            console.error('Error updating paid features for client:', updateError);
          } else {
            console.info(`Enabled paid features for white label client ${client.id}: ${Object.keys(paidFields).join(', ')}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('White label feature activation error:', err);
  }
  // === END: White Label Feature Activation (Safe Addition) ===
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
        status: 'not_started',
      },
      { onConflict: 'customer_id' }
    );
    if (noSubError) {
      console.error('Error updating subscription status:', noSubError);
      throw new Error('Failed to update subscription status in database');
    }
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
      status: subscription.status,
    },
    { onConflict: 'customer_id' }
  );
  if (subError) {
    console.error('Error syncing subscription:', subError);
    throw new Error('Failed to sync subscription in database');
  }
  console.info(`Successfully synced subscription for customer: ${customerId}`);
}
