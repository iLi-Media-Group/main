import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  appInfo: { name: 'Bolt Integration', version: '1.0.0' },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const corsHeaders = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'stripe-signature',
});

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: corsHeaders,
        status: 405,
      });
    }

    const sig = req.headers.get('stripe-signature');
    const body = await req.text();

    if (!sig) {
      return new Response('No signature found', { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, stripeWebhookSecret);
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    await handleEvent(event);

    return new Response(JSON.stringify({ received: true }), {
      headers: corsHeaders,
      status: 200,
    });
  } catch (e) {
    console.error('Fatal error in Edge function:', e);
    return new Response('Internal Server Error', { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  try {
    const stripeData = event?.data?.object ?? {};
    if (!stripeData || typeof stripeData !== 'object') return;

    const customerId = stripeData.customer;
    if (!customerId || typeof customerId !== 'string') {
      console.error('Missing customer ID');
      return;
    }

    if (event.type === 'payment_intent.succeeded' && stripeData.invoice === null) {
      return;
    }

    const session = stripeData as Stripe.Checkout.Session;
    const { metadata, payment_status, mode, id: checkout_session_id, payment_intent, amount_total, amount_subtotal, currency } = session;

    const isSubscription = mode === 'subscription';

    if (isSubscription) {
      console.info(`Syncing subscription for customer ${customerId}`);
      await syncCustomerFromStripe(customerId);
      return;
    }

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
      console.error('Error inserting order:', orderError);
      return;
    }

    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .single();

    if (customerError || !customerData?.user_id) {
      console.error('Failed to fetch user_id for customer:', customerError);
      return;
    }

    const userId = customerData.user_id;

    if (metadata?.proposal_id) {
      const { data: proposalData, error: proposalError } = await supabase
        .from('sync_proposals')
        .select('id, track_id, client_id, track:tracks!inner(producer_id, title)')
        .eq('id', metadata.proposal_id)
        .single();

      if (proposalError || !proposalData?.track?.producer_id) {
        console.error('Error fetching proposal data:', proposalError);
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
        console.error('Error updating proposal status:', updateError);
        return;
      }

      const [producer, client] = await Promise.all([
        supabase.from('profiles').select('email').eq('id', proposalData.track.producer_id).single(),
        supabase.from('profiles').select('email').eq('id', proposalData.client_id).single(),
      ]);

      if (producer.error || client.error) {
        console.error('Error fetching email(s):', { producerError: producer.error, clientError: client.error });
        return;
      }

      try {
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
            producerEmail: producer.data.email,
            clientEmail: client.data.email,
          }),
        });
      } catch (notifyError) {
        console.error('Error sending payment notification:', notifyError);
      }

      console.info(`Processed sync proposal payment: ${metadata.proposal_id}`);
      return;
    }

    if (metadata?.track_id) {
      const { data: trackData, error: trackError } = await supabase
        .from('tracks')
        .select('id, producer_id')
        .eq('id', metadata.track_id)
        .single();

      if (trackError || !trackData?.producer_id) {
        console.error('Error fetching track data:', trackError);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', userId)
        .single();

      if (profileError || !profileData?.email) {
        console.error('Error fetching buyer profile:', profileError);
        return;
      }

      const licenseeInfo = {
        name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
        email: profileData.email,
      };

      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          track_id: trackData.id,
          producer_id: trackData.producer_id,
          buyer_id: userId,
          license_type: 'Single Track',
          amount: amount_total / 100,
          payment_method: 'stripe',
          transaction_id: payment_intent,
          created_at: new Date().toISOString(),
          licensee_info: licenseeInfo,
        });

      if (saleError) {
        console.error('Error creating license record:', saleError);
        return;
      }

      console.info(`Created license record for track ${metadata.track_id}`);
    }
  } catch (error) {
    console.error('Error in handleEvent:', error);
    throw error;
  }
}
