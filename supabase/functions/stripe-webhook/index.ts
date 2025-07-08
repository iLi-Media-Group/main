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
  console.log('=== STRIPE WEBHOOK CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  };
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Add a simple test endpoint
  if (req.url.includes('/test')) {
    return new Response(JSON.stringify({ 
      message: 'Stripe webhook function is working',
      timestamp: new Date().toISOString()
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  // Log all incoming requests for debugging
  console.log('=== INCOMING REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Content-Type:', req.headers.get('content-type'));
  console.log('Stripe-Signature:', req.headers.get('stripe-signature') ? 'present' : 'missing');
  console.log('Authorization:', req.headers.get('authorization') ? 'present' : 'missing');
  
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders
      });
    }
    
    const sigHeader = req.headers.get('stripe-signature');
    const authHeader = req.headers.get('authorization');
    
    console.log('Stripe signature header:', sigHeader ? 'present' : 'missing');
    console.log('Authorization header:', authHeader ? 'present' : 'missing');
    
    // If it's a Stripe webhook (has stripe-signature), don't require auth
    // If it's from another function (no stripe-signature), require auth
    if (!sigHeader && !authHeader && !req.url.includes('/test')) {
      console.log('No Stripe signature or authorization found for webhook request');
      return new Response('No signature or authorization found', { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Accept both Stripe webhooks (with stripe-signature) and function calls (with authorization)
    // Stripe webhooks don't send authorization headers, function calls do
    if (!sigHeader && !authHeader) {
      console.log('No Stripe signature or authorization found');
      return new Response('Missing authorization header', { 
        status: 401,
        headers: corsHeaders
      });
    }
    
    // If it's a test request without signature, allow it
    if (req.url.includes('/test') && !sigHeader) {
      return new Response(JSON.stringify({ 
        message: 'Stripe webhook function is working',
        timestamp: new Date().toISOString()
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    const rawBody = await req.arrayBuffer();
    console.log('Raw body length:', rawBody.byteLength);
    
    // Only verify signature for actual Stripe webhook events
    if (sigHeader) {
      // Verify signature
      let isValid = false;
      try {
        isValid = await verifyStripeSignature(rawBody, sigHeader, stripeWebhookSecret);
        console.log('Signature verification result:', isValid);
      } catch (err) {
        console.error('Signature verification error:', err);
        return new Response('Webhook signature verification failed', { 
          status: 400,
          headers: corsHeaders
        });
      }
      if (!isValid) {
        console.error('Webhook signature verification failed: Invalid signature');
        return new Response('Webhook signature verification failed', { 
          status: 400,
          headers: corsHeaders
        });
      }
    }
    // Parse event
    let event;
    try {
      event = JSON.parse(ab2str(rawBody));
      console.log('Event type:', event.type);
      console.log('Event data keys:', Object.keys(event.data?.object || {}));
    } catch (err) {
      console.error('Invalid JSON:', err);
      return new Response('Invalid JSON', { status: 400 });
    }
    // Handle event
    console.log('Calling handleEvent...');
    handleEvent(event); // No waitUntil, just fire and forget
    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: any) {
  console.log('=== HANDLE EVENT ===');
  console.log('Event type:', event.type);
  
  const stripeData = event?.data?.object ?? {};
  if (!stripeData) {
    console.log('No stripe data found');
    return;
  }
  if (!('customer' in stripeData)) {
    console.log('No customer in stripe data');
    return;
  }
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    console.log('Skipping payment_intent.succeeded with null invoice');
    return;
  }
  const { customer: customerId } = stripeData;
  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
    return;
  }
  console.log('Customer ID:', customerId);
  
  let isSubscription = true;
  if (event.type === 'checkout.session.completed') {
    const { mode } = stripeData;
    isSubscription = mode === 'subscription';
    console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    
    // Debug metadata for white label
    console.log('Checkout session metadata:', stripeData.metadata);
    if (stripeData.metadata?.email) {
      console.log('White label metadata found:', {
        email: stripeData.metadata.email,
        password: stripeData.metadata.password ? 'present' : 'missing',
        first_name: stripeData.metadata.first_name,
        last_name: stripeData.metadata.last_name,
        company: stripeData.metadata.company
      });
    }
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
      
      console.log('Processing one-time payment with metadata:', metadata);
      
      // Check if this is a white label client onboarding
      if (metadata?.email && metadata?.password && metadata?.first_name && metadata?.last_name) {
        console.info('Processing white label client onboarding');
        
        try {
          // Create Auth user
          console.log('Creating Auth user for:', metadata.email);
          const { data: user, error: userError } = await supabase.auth.admin.createUser({
            email: metadata.email,
            password: metadata.password,
            email_confirm: true
          });

          if (userError || !user?.user?.id) {
            console.error('Failed to create white label user:', userError);
            return;
          }

          const userId = user.user.id;
          console.log('Created Auth user with ID:', userId);

          // Insert into white_label_clients
          console.log('Inserting into white_label_clients...');
          const { error: insertError } = await supabase
            .from('white_label_clients')
            .insert([{
              owner_id: userId,
              email: metadata.email,
              display_name: metadata.company || (metadata.first_name + ' ' + metadata.last_name),
              first_name: metadata.first_name,
              last_name: metadata.last_name
            }]);

          if (insertError) {
            console.error('Failed to insert white label client:', insertError);
            return;
          }

          console.log('Successfully inserted white label client');

          // Send magic link
          console.log('Sending magic link...');
          const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(metadata.email);
          if (inviteError) {
            console.error('Failed to send magic link:', inviteError);
            return;
          }

          console.info('White label client onboarding completed successfully');
          return; // Skip the regular order processing for white label clients
        } catch (error) {
          console.error('Error in white label client onboarding:', error);
          return;
        }
      } else {
        console.log('Not a white label client onboarding - missing required metadata');
      }
      
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