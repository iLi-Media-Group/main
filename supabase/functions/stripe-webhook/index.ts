import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: { name: 'Bolt Integration', version: '1.0.0' },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature found', { status: 400, headers: corsHeaders });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook signature verification failed: ${err.message}`, {
        status: 400,
        headers: corsHeaders,
      });
    }

    await handleEvent(event);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: any) {
    console.error('Error processing webhook:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};
  if (!stripeData || !('customer' in stripeData)) return;

  const { customer: customerId } = stripeData;
  if (!customerId || typeof customerId !== 'string') {
    console.error(`Invalid customer in event: ${JSON.stringify(event)}`);
    return;
  }

  const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

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
<<<<<<< HEAD
          metadata,
        } = stripeData as Stripe.Checkout.Session;

=======
          currency,
          metadata,
        } = stripeData as Stripe.Checkout.Session;

        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent,
          customer_id: customerId,
          amount_subtotal,
          amount_total,
          currency,
          payment_status,
          status: 'completed',
          metadata,
        });

        if (orderError) {
          console.error('Error inserting stripe_order:', orderError);
          return;
        }

>>>>>>> c2868b28753bfd6cb792eef8f74ff67924b9661e
        const { data: customerData, error: customerError } = await supabase
          .from('stripe_customers')
          .select('user_id')
          .eq('customer_id', customerId)
          .single();

        if (customerError || !customerData?.user_id) {
          console.error('Error fetching stripe customer user_id:', customerError);
          return;
        }

<<<<<<< HEAD
=======
        // === Proposal Payment ===
        if (metadata?.proposal_id) {
          const { data: proposalData, error: proposalError } = await supabase
            .from('sync_proposals')
            .select(`
              id, 
              track_id, 
              client_id,
              track:tracks!inner (
                producer_id,
                title
              )
            `)
            .eq('id', metadata.proposal_id)
            .single();

          if (proposalError) {
            console.error('Error fetching proposal:', proposalError);
            return;
          }

          const { error: updateError } = await supabase
            .from('sync_proposals')
            .update({
              payment_status: 'paid',
              payment_date: new Date().toISOString(),
              invoice_id: payment_intent,
            })
            .eq('id', metadata.proposal_id);

          if (updateError) {
            console.error('Error updating proposal:', updateError);
            return;
          }

          const { data: producerData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', proposalData.track.producer_id)
            .single();

          const { data: clientData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', proposalData.client_id)
            .single();

          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-proposal-update`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              proposalId: metadata.proposal_id,
              action: 'payment_complete',
              trackTitle: proposalData.track.title,
              producerEmail: producerData?.email,
              clientEmail: clientData?.email,
            }),
          });

          console.info(`Processed sync proposal ${metadata.proposal_id}`);
          return;
        }

>>>>>>> c2868b28753bfd6cb792eef8f74ff67924b9661e
        // === Track Purchase ===
        const trackId = metadata?.track_id;

        if (trackId && customerData?.user_id) {
          const { data: trackData, error: trackError } = await supabase
            .from('tracks')
            .select('id, producer_id')
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
            producer_id: trackData.producer_id,
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
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
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
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      { onConflict: 'customer_id' }
    );

    if (subError) throw new Error('Failed to sync subscription data');

    console.info(`Subscription synced for customer ${customerId}`);
  } catch (error) {
    console.error(`Error syncing subscription for ${customerId}:`, error);
    throw error;
  }
}
