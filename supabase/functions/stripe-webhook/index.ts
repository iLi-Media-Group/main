import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0'
  }
});
const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
Deno.serve(async (req) => {
  console.log('=== WEBHOOK RECEIVED ===');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  // Check for authorization header (required by Supabase)
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    console.log('No authorization header found');
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await req.text();
    console.log('Body:', body);
    
    return new Response(JSON.stringify({ 
      received: true,
      message: 'Webhook processed successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
async function handleEvent(event) {
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
  const { mode, payment_status, metadata } = stripeData;
  if (isSubscription) {
    console.info(`Starting subscription sync for customer: ${customerId}`);
    await syncCustomerFromStripe(customerId);
  } else if (mode === 'payment' && payment_status === 'paid') {
    if (metadata?.proposal_id) {
      await handleSyncProposalPayment(stripeData, metadata, customerId);
    } else if (metadata?.type === 'single_track' || metadata?.track_id) {
      await handleTrackLicensePayment(stripeData, metadata, customerId);
    } else {
      console.warn('Unrecognized payment type in webhook:', metadata);
    }
  }
}

// --- Dedicated Handlers ---

async function handleSyncProposalPayment(session, metadata, customerId) {
  // All logic for sync proposal payments only
  try {
    // Get proposal details
    const { data: proposalData, error: proposalError } = await supabase.from('sync_proposals').select(`
      id, track_id, client_id, track:tracks!inner (producer_id, title)
    `).eq('id', metadata.proposal_id).single();
    if (proposalError) {
      console.error('Error fetching proposal data:', proposalError);
      return;
    }
    // Update proposal payment status
    const { error: updateError } = await supabase.from('sync_proposals').update({
      payment_status: 'paid',
      payment_date: new Date().toISOString(),
      invoice_id: session.payment_intent
    }).eq('id', metadata.proposal_id);
    if (updateError) {
      console.error('Error updating proposal payment status:', updateError);
      return;
    }
    // Generate PDF license via handle-license-agreement
    const licenseeEmail = metadata.client_email || proposalData.client_email;
    const licenseeInfo = metadata.client_name || '';
    const trackTitle = proposalData.track.title;
    const licenseType = 'sync_proposal';
    console.log('Calling handle-license-agreement with headers:', {
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json'
    });
    const pdfRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-license-agreement`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        licenseId: proposalData.id,
        licenseeEmail,
        licenseeInfo,
        trackTitle,
        licenseType,
        pdfUrl: null // let the function generate and store the PDF
      })
    });
    let pdfUrl = null;
    if (pdfRes.ok) {
      const pdfData = await pdfRes.json();
      pdfUrl = pdfData.pdfUrl || pdfData.pdf_url || null;
    }
    // Insert into license_agreements
    await supabase.from('license_agreements').insert({
      license_id: proposalData.id,
      type: 'sync_proposal',
      pdf_url: pdfUrl,
      licensee_info: licenseeInfo,
      sent_at: new Date().toISOString()
    });
    // Send license email
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-license-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientName: licenseeInfo,
        clientEmail: licenseeEmail,
        trackName: trackTitle,
        licenseTier: 'Sync Proposal',
        licenseDate: new Date().toISOString(),
        expirationDate: null,
        pdfUrl
      })
    });
    // Notifications (already present)
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
          producerEmail: metadata.producer_email,
          clientEmail: licenseeEmail
        })
      });
    } catch (notifyError) {
      console.error('Error sending payment notification:', notifyError);
    }
    console.info(`Successfully processed sync proposal payment for proposal: ${metadata.proposal_id}`);
  } catch (error) {
    console.error('Error in handleSyncProposalPayment:', error);
  }
}

async function handleTrackLicensePayment(session, metadata, customerId) {
  // All logic for standard track license purchases only
  try {
    // Get the user_id associated with this customer
    const { data: customerData, error: customerError } = await supabase.from('stripe_customers').select('user_id').eq('customer_id', customerId).single();
    if (customerError) {
      console.error('Error fetching customer data:', customerError);
      return;
    }
    const trackId = metadata?.track_id;
    if (trackId && customerData?.user_id) {
      // Get track details to get producer_id
      const { data: trackData, error: trackError } = await supabase.from('tracks').select('id, producer_id, title').eq('id', trackId).single();
      if (trackError) {
        console.error('Error fetching track data:', trackError);
        return;
      }
      // Get user profile for licensee info
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('first_name, last_name, email').eq('id', customerData.user_id).single();
      if (profileError) {
        console.error('Error fetching profile data:', profileError);
        return;
      }
      // Create license record
      const { error: saleError } = await supabase.from('sales').insert({
        track_id: trackData.id,
        producer_id: trackData.producer_id,
        buyer_id: customerData.user_id,
        license_type: 'Single Track',
        amount: session.amount_total / 100,
        payment_method: 'stripe',
        transaction_id: session.payment_intent,
        created_at: new Date().toISOString(),
        licensee_info: {
          name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
          email: profileData.email
        }
      });
      if (saleError) {
        console.error('Error creating sales record:', saleError);
        return;
      }
      // Generate PDF license via handle-license-agreement
      const licenseeEmail = profileData.email;
      const licenseeInfo = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
      const trackTitle = trackData.title;
      const licenseType = 'single_track';
      console.log('Calling handle-license-agreement with headers:', {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      });
      const pdfRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-license-agreement`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          licenseId: trackData.id,
          licenseeEmail,
          licenseeInfo,
          trackTitle,
          licenseType,
          pdfUrl: null // let the function generate and store the PDF
        })
      });
      let pdfUrl = null;
      if (pdfRes.ok) {
        const pdfData = await pdfRes.json();
        pdfUrl = pdfData.pdfUrl || pdfData.pdf_url || null;
      }
      // Insert into license_agreements
      await supabase.from('license_agreements').insert({
        license_id: trackData.id,
        type: 'single_track',
        pdf_url: pdfUrl,
        licensee_info: licenseeInfo,
        sent_at: new Date().toISOString()
      });
      // Send license email
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-license-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientName: licenseeInfo,
          clientEmail: licenseeEmail,
          trackName: trackTitle,
          licenseTier: 'Single Track',
          licenseDate: new Date().toISOString(),
          expirationDate: null,
          pdfUrl
        })
      });
      console.info(`Successfully processed track license sale for track: ${trackId}`);
    }
  } catch (error) {
    console.error('Error in handleTrackLicensePayment:', error);
  }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: [
        'data.default_payment_method'
      ]
    });
    // TODO verify if needed
    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert({
        customer_id: customerId,
        subscription_status: 'not_started'
      }, {
        onConflict: 'customer_id'
      });
      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }
    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];
    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert({
      customer_id: customerId,
      subscription_id: subscription.id,
      price_id: subscription.items.data[0].price.id,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      ...subscription.default_payment_method && typeof subscription.default_payment_method !== 'string' ? {
        payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
        payment_method_last4: subscription.default_payment_method.card?.last4 ?? null
      } : {},
      status: subscription.status
    }, {
      onConflict: 'customer_id'
    });
    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}
