import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { Resend } from 'npm:resend';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { appInfo: { name: 'Bolt Integration', version: '1.0.0' } });
const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// Helper: Generate a simple license PDF (placeholder)
async function generateLicensePDF(data: { buyerName: string, buyerEmail: string, trackTitle: string, producerName: string, licenseType: string, date: string }) {
  const pdfContent = `License Agreement\nTrack: ${data.trackTitle}\nProducer: ${data.producerName}\nBuyer: ${data.buyerName}\nDate: ${data.date}`;
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  return blob;
}

// Helper: Send license email with Resend
async function sendLicenseEmail(to: string, pdf: Blob, trackTitle: string) {
  // NOTE: Resend API does not support attachments directly in the JS SDK as of now, so this is a placeholder for future support.
  await resend.emails.send({
    from: 'MyBeatFi <noreply@mybeatfi.io>',
    to: [to],
    subject: `Your License for ${trackTitle}`,
    html: `<p>Thanks for your purchase! Attached is your license for <strong>${trackTitle}</strong>.</p>`
    // attachments: [{ filename: `${trackTitle}_License.pdf`, content: pdf }], // Uncomment when supported
  });
}

// Helper: Send welcome email with Resend
async function sendWelcomeEmail(to: string, name: string, company: string) {
  await resend.emails.send({
    from: 'MyBeatFi <noreply@mybeatfi.io>',
    to: [to],
    subject: 'Welcome to MyBeatFi White Label!',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your white label platform <strong>${company}</strong> is ready to go.</p>
      <p><a href="https://mybeatfi.io/wl-dashboard">Access your dashboard</a> to start managing your content.</p>
    `
  });
}

Deno.serve(async (req) => {
  // Debug: Log all incoming headers
  console.log('Incoming request headers:', Object.fromEntries(req.headers.entries()));
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // Remove any Authorization header check here. Only check for stripe-signature.
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('No signature found', { status: 400, headers: corsHeaders });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!);
  } catch (error: any) {
    return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400, headers: corsHeaders });
  }

  // Log event to Supabase
  const metadata = (event.data.object as any)?.metadata || {};
  // Debug log for received metadata
  const objectId = (event.data.object as any)?.id || (event.data.object as any)?.payment_intent || 'N/A';
  console.log('Webhook event:', event.type, 'Session/Payment ID:', objectId, 'Metadata:', metadata);
  await supabase.from('stripe_webhook_logs').insert({
    event_id: event.id,
    event_type: event.type,
    metadata,
    status: 'received',
    created_at: new Date().toISOString()
  });

  // --- White Label Onboarding (from new handler) ---
  if (event.type === 'checkout.session.completed' && metadata.type === 'white_label_setup') {
    try {
      const email = metadata.customer_email;
      const companyName = metadata.company_name || '';
      const fullName = metadata.customer_name || '';
      const [firstName, ...rest] = fullName.split(' ');
      const lastName = rest.join(' ');
      let profileId: string | null = null;
      const { data: existingProfile } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
      if (!existingProfile) {
        const { data: newProfile } = await supabase.from('profiles').insert({
          email,
          first_name: firstName,
          last_name: lastName,
          company_name: companyName,
          account_type: 'white_label',
          role: 'white_label_admin',
          created_at: new Date().toISOString()
        }).select('id').single();
        profileId = newProfile.id;
      } else {
        profileId = existingProfile.id;
        await supabase.from('profiles').update({ role: 'white_label_admin' }).eq('id', profileId);
      }
      const { data: existingWL } = await supabase.from('white_label_clients').select('id').eq('owner_id', profileId).maybeSingle();
      if (!existingWL) {
        await supabase.from('white_label_clients').insert({
          owner_id: profileId,
          display_name: companyName || fullName || 'White Label Client',
          company_name: companyName,
          owner_email: email,
          primary_color: '#1a73e8',
          secondary_color: '#ffffff',
          logo_url: null,
          created_at: new Date().toISOString()
        });
      }
      
      // Insert white label setup payment into stripe_orders table
      const stripeData = event.data.object as any;
      const { error: orderError } = await supabase.from('stripe_orders').insert({
        checkout_session_id: stripeData.id,
        payment_intent_id: stripeData.payment_intent,
        customer_id: stripeData.customer,
        amount_subtotal: stripeData.amount_subtotal,
        amount_total: stripeData.amount_total,
        currency: stripeData.currency,
        payment_status: stripeData.payment_status,
        status: 'completed',
        metadata: {
          type: 'white_label_setup',
          customer_email: email,
          customer_name: fullName,
          company_name: companyName,
          client_id: existingWL?.id || null
        },
        created_at: new Date().toISOString()
      });
      
      if (orderError) {
        console.error('Error inserting white label order:', orderError);
      }
      
      // Update paid status for purchased features
      const features = metadata.features ? metadata.features.split(',') : [];
      const updateObj: any = {};
      
      if (features.includes('ai_recommendations')) {
        updateObj.ai_search_assistance_paid = true;
      }
      if (features.includes('producer_applications')) {
        updateObj.producer_onboarding_paid = true;
      }
      if (features.includes('deep_media_search')) {
        updateObj.deep_media_search_paid = true;
      }
      
      // If Pro plan was purchased, mark producer onboarding as paid
      if (metadata.plan === 'pro') {
        updateObj.producer_onboarding_paid = true;
      }
      
      // --- NEW: Update revenue/feature columns ---
      // Parse features and amount from metadata
      const featuresArray = metadata.features
        ? metadata.features.split(',').map((f: string) => f.trim()).filter((f: string) => f)
        : [];
      const featuresAmount = metadata.features_amount
        ? Number(metadata.features_amount)
        : null;
      const setupAmount = stripeData.amount_total ? stripeData.amount_total / 100 : null;
      
      if (existingWL?.id) {
        await supabase.from('white_label_clients').update({
          setup_amount_paid: setupAmount,
          features_purchased: featuresArray.length > 0 ? featuresArray : null,
          features_amount_paid: featuresAmount
        }).eq('id', existingWL.id);
      }
      // --- END NEW ---
      
      if (Object.keys(updateObj).length > 0) {
        const clientId = existingWL?.id;
        if (clientId) {
          const { error: updateError } = await supabase
            .from('white_label_clients')
            .update(updateObj)
            .eq('id', clientId);
          
          if (updateError) {
            console.error('Error updating paid status:', updateError);
          } else {
            console.log('Successfully marked features as paid');
          }
        }
      }
      
      // Send welcome email
      await sendWelcomeEmail(email, fullName, companyName);
    } catch (error) {
      console.error('Error processing white label onboarding:', error);
    }
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
  }

  // --- Additional White Label Feature Purchases ---
  if (event.type === 'checkout.session.completed' && metadata.type === 'white_label_feature') {
    try {
      const clientId = metadata.client_id;
      const featuresArray = metadata.features
        ? metadata.features.split(',').map((f: string) => f.trim()).filter((f: string) => f)
        : [];
      const featuresAmount = metadata.features_amount
        ? Number(metadata.features_amount)
        : null;

      if (clientId) {
        // Fetch current features and amount
        const { data: client, error } = await supabase
          .from('white_label_clients')
          .select('features_purchased, features_amount_paid')
          .eq('id', clientId)
          .single();

        let updatedFeatures = Array.isArray(client?.features_purchased) ? client.features_purchased : [];
        updatedFeatures = [...new Set([...updatedFeatures, ...featuresArray])];

        const updatedAmount = (client?.features_amount_paid || 0) + (featuresAmount || 0);

        await supabase.from('white_label_clients').update({
          features_purchased: updatedFeatures,
          features_amount_paid: updatedAmount
        }).eq('id', clientId);
      }
    } catch (error) {
      console.error('Error processing additional white label feature purchase:', error);
    }
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
  }

  // --- Other Features (preserved from existing handler) ---
  try {
    const stripeData = event.data.object as any;
    const customerId = stripeData.customer as string;
    // --- Subscription sync ---
    let isSubscription = true;
    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData;
      isSubscription = mode === 'subscription';
      if (!isSubscription && metadata.type !== 'white_label_setup') {
        // One-time payment (track purchase or sync proposal)
        const { payment_status } = stripeData;
        if (mode === 'payment' && payment_status === 'paid') {
          try {
            const {
              id: checkout_session_id,
              payment_intent,
              amount_subtotal,
              amount_total,
              currency,
              metadata
            } = stripeData;
            // --- Sync Proposal Payment ---
            if (metadata?.proposal_id) {
              const { data: proposalData, error: proposalError } = await supabase
                .from('sync_proposals')
                .select(`id, track_id, client_id, track:tracks!inner (track_producer_id, title)`)
                .eq('id', metadata.proposal_id)
                .single();
              if (proposalError) {
                console.error('Error fetching proposal data:', proposalError);
                return new Response('Error fetching proposal data', { status: 500, headers: corsHeaders });
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
                return new Response('Error updating proposal payment status', { status: 500, headers: corsHeaders });
              }
              // Restore: Insert into stripe_orders for sync proposal payments
              await supabase.from('stripe_orders').insert({
                checkout_session_id: checkout_session_id,
                payment_intent_id: payment_intent,
                customer_id: customerId,
                amount_subtotal: amount_subtotal,
                amount_total: amount_total,
                currency: currency,
                payment_status: 'paid',
                status: 'completed',
                metadata: { proposal_id: metadata.proposal_id },
                created_at: new Date().toISOString()
              });
              
              // Generate license agreement for the sync proposal
              try {
                await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-license-agreement`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    proposal_id: metadata.proposal_id
                  })
                });
                console.log('License agreement handled for sync proposal:', metadata.proposal_id);
              } catch (licenseError) {
                console.error('Error handling license agreement:', licenseError);
                // Don't fail the webhook if license generation fails
              }
              
              // Notify proposal update
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
                    producerEmail: proposalData.track.producer?.email,
                    clientEmail: proposalData.client?.email
                  })
                });
              } catch (notifyError) {
                console.error('Error sending payment notification:', notifyError);
              }
              
              // Return after processing sync proposal payment
              return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
            }
            // --- Custom Sync Request Payment ---
            if (metadata?.type === 'sync_payment') {
              const syncRequestId = metadata.sync_request_id;
              const syncSubmissionId = metadata.sync_submission_id;
              const producerId = metadata.producer_id;
              const clientId = metadata.client_id;
              
              try {
                // Update custom sync request status and payment info
                const { error: requestError } = await supabase
                  .from('custom_sync_requests')
                  .update({
                    status: 'completed',
                    payment_status: 'paid',
                    stripe_invoice_id: payment_intent,
                    final_amount: (amount_total / 100).toString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', syncRequestId);
                
                if (requestError) {
                  console.error('Error updating sync request:', requestError);
                  return new Response('Error updating sync request', { status: 500, headers: corsHeaders });
                }
                
                // (Optional) Add any other logic for notifications, etc.
                
                console.log(`Successfully processed sync payment: ${payment_intent} for request ${syncRequestId}`);
                return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
              } catch (syncError) {
                console.error('Error processing sync payment:', syncError);
                return new Response('Error processing sync payment', { status: 500, headers: corsHeaders });
              }
            }
            // --- Single Track Purchase ---
            if (metadata?.track_id) {
              // Insert into stripe_orders for single track purchase
              const { error: orderInsertError } = await supabase.from('stripe_orders').insert({
                checkout_session_id: checkout_session_id,
                payment_intent_id: payment_intent,
                customer_id: customerId,
                amount_subtotal: amount_subtotal,
                amount_total: amount_total,
                currency: currency,
                payment_status: 'paid',
                status: 'completed',
                metadata,
                created_at: new Date().toISOString()
              });
              if (orderInsertError) {
                console.error('Error inserting single track order:', orderInsertError);
                return new Response('Error inserting single track order', { status: 500, headers: corsHeaders });
              }
            }
            // --- Track Purchase ---
            const trackId = metadata?.track_id;
            if (trackId && customerId) {
              const { data: trackData, error: trackError } = await supabase
                .from('tracks')
                .select('id, track_producer_id')
                .eq('id', trackId)
                .single();
              if (trackError) {
                console.error('Error fetching track data:', trackError);
                return new Response('Error fetching track data', { status: 500, headers: corsHeaders });
              }
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('first_name, last_name, email')
                .eq('id', customerId)
                .single();
              if (profileError) {
                console.error('Error fetching profile data:', profileError);
                return new Response('Error fetching profile data', { status: 500, headers: corsHeaders });
              }
              const { error: saleError } = await supabase
                .from('sales')
                .insert({
                  track_id: trackData.id,
                  sale_producer_id: trackData.track_producer_id,
                  buyer_id: customerId,
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
                return new Response('Error creating license record', { status: 500, headers: corsHeaders });
              }
              // Send license email (Resend)
              try {
                const pdf = await generateLicensePDF({
                  buyerName: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
                  buyerEmail: profileData.email,
                  trackTitle: trackData.id,
                  producerName: '', // Optionally fetch producer name
                  licenseType: 'Single Track',
                  date: new Date().toISOString()
                });
                await sendLicenseEmail(profileData.email, pdf, trackData.id);
              } catch (emailError) {
                console.error('Error sending license email:', emailError);
              }
              return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
            }
          } catch (error) {
            console.error('Error processing one-time payment:', error);
            return new Response('Error processing one-time payment', { status: 500, headers: corsHeaders });
          }
        }
      }
    }
    // --- Subscription sync ---
    if (isSubscription && customerId) {
      try {
        // Use Stripe API to fetch subscriptions
        const res = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customerId}&limit=1&status=all&expand[]=data.default_payment_method`, {
          headers: { Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` },
        });
        const subscriptions = await res.json();
        if (!subscriptions.data || subscriptions.data.length === 0) {
          await supabase.from('stripe_subscriptions').upsert({
            customer_id: customerId,
            status: 'not_started',
          }, { onConflict: 'customer_id' });
        } else {
          const subscription = subscriptions.data[0];
          const priceId = subscription.items.data[0].price.id;
          await supabase.from('stripe_subscriptions').upsert({
            customer_id: customerId,
            subscription_id: subscription.id,
            price_id: priceId,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            payment_method_brand: subscription.default_payment_method?.card?.brand ?? null,
            payment_method_last4: subscription.default_payment_method?.card?.last4 ?? null,
            status: subscription.status,
          }, { onConflict: 'customer_id' });

          // --- NEW: Update membership_plan in profiles ---
          // Map price_id to plan name
          let planName = 'Unknown';
          console.log('Processing subscription with price_id:', priceId);
          switch (priceId) {
            case 'price_1RdAfqR8RYA8TFzwKP7zrKsm':
              planName = 'Ultimate Access';
              break;
            case 'price_1RdAfXR8RYA8TFzwFZyaSREP':
              planName = 'Platinum Access';
              break;
            case 'price_1RdAfER8RYA8TFzw7RrrNmtt':
              planName = 'Gold Access';
              break;
            case 'price_1RdAeZR8RYA8TFzwVH3MHECa':
              planName = 'Single Track';
              break;
            default:
              planName = 'Unknown';
              console.log('Unknown price_id:', priceId);
          }
          console.log('Mapped to plan name:', planName);
          // Find user_id from stripe_customers
          console.log('Looking up customer_id:', customerId);
          const { data: customerRecord, error: customerLookupError } = await supabase
            .from('stripe_customers')
            .select('user_id')
            .eq('customer_id', customerId)
            .maybeSingle();
          
          if (customerLookupError) {
            console.error('Error looking up user_id for customer:', customerId, customerLookupError);
          }
          
          console.log('Customer record found:', customerRecord);
          
          if (customerRecord && customerRecord.user_id) {
            // Update membership_plan in profiles
            const { error: updateProfileError } = await supabase
              .from('profiles')
              .update({ membership_plan: planName })
              .eq('id', customerRecord.user_id);
            if (updateProfileError) {
              console.error('Error updating membership_plan in profiles:', updateProfileError, {
                planName,
                user_id: customerRecord.user_id,
                customer_id: customerId,
                event_type: event.type
              });
            } else {
              console.log(`Updated membership_plan to ${planName} for user ${customerRecord.user_id} (event: ${event.type})`);
            }
          } else {
            console.error('No customerRecord found for customer_id:', customerId, 'event:', event.type);
            
            // Fallback: Try to find user by email from Stripe customer
            try {
              const stripeCustomer = await stripe.customers.retrieve(customerId);
              if (stripeCustomer.email) {
                console.log('Attempting to find user by email:', stripeCustomer.email);
                
                // Find user by email
                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('id, email')
                  .eq('email', stripeCustomer.email)
                  .maybeSingle();
                
                if (profileData && profileData.id) {
                  console.log('Found user by email, updating membership plan:', profileData.id);
                  
                  // Create stripe_customers record if it doesn't exist
                  await supabase
                    .from('stripe_customers')
                    .upsert({
                      user_id: profileData.id,
                      customer_id: customerId
                    }, { onConflict: 'customer_id' });
                  
                  // Update membership plan
                  const { error: updateProfileError } = await supabase
                    .from('profiles')
                    .update({ membership_plan: planName })
                    .eq('id', profileData.id);
                  
                  if (updateProfileError) {
                    console.error('Error updating membership_plan in profiles (fallback):', updateProfileError);
                  } else {
                    console.log(`Updated membership_plan to ${planName} for user ${profileData.id} (fallback method)`);
                  }
                } else {
                  console.error('No profile found for email:', stripeCustomer.email);
                }
              }
            } catch (stripeError) {
              console.error('Error retrieving Stripe customer:', stripeError);
            }
          }
          // --- END NEW ---
        }
      } catch (subError) {
        console.error('Error syncing subscription:', subError);
        return new Response('Error syncing subscription', { status: 500, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
    }
    // --- Handle subscription update (cancel_at_period_end toggled, upgrade, etc.) ---
    if (event.type === 'customer.subscription.updated') {
      try {
        const stripeData = event.data.object as any;
        const customerId = stripeData.customer;
        const cancelAtPeriodEnd = stripeData.cancel_at_period_end;
        const currentPeriodEnd = stripeData.current_period_end;
        // Find user_id from stripe_customers
        const { data: customerRecord, error: customerLookupError } = await supabase
          .from('stripe_customers')
          .select('user_id')
          .eq('customer_id', customerId)
          .maybeSingle();
        if (customerLookupError) {
          console.error('Error looking up user_id for customer:', customerId, customerLookupError);
        }
        if (customerRecord && customerRecord.user_id) {
          if (cancelAtPeriodEnd) {
            // Set pending downgrade fields
            await supabase
              .from('profiles')
              .update({
                subscription_cancel_at_period_end: true,
                subscription_current_period_end: new Date(currentPeriodEnd * 1000).toISOString()
              })
              .eq('id', customerRecord.user_id);
          } else {
            // Clear pending downgrade fields
            await supabase
              .from('profiles')
              .update({
                subscription_cancel_at_period_end: false,
                subscription_current_period_end: null
              })
              .eq('id', customerRecord.user_id);
          }
        }
      } catch (error) {
        console.error('Error handling subscription update event:', error);
      }
      return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
    }
    // --- Handle subscription cancellation (downgrade to Single Track) ---
    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.canceled') {
      try {
        const stripeData = event.data.object as any;
        const customerId = stripeData.customer;
        // Find user_id from stripe_customers
        const { data: customerRecord, error: customerLookupError } = await supabase
          .from('stripe_customers')
          .select('user_id')
          .eq('customer_id', customerId)
          .maybeSingle();
        if (customerLookupError) {
          console.error('Error looking up user_id for customer:', customerId, customerLookupError);
        }
        if (customerRecord && customerRecord.user_id) {
          // Update membership_plan in profiles to 'Single Track' and clear pending downgrade fields
          const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({ 
              membership_plan: 'Single Track',
              subscription_cancel_at_period_end: false,
              subscription_current_period_end: null
            })
            .eq('id', customerRecord.user_id);
          if (updateProfileError) {
            console.error('Error updating membership_plan to Single Track:', updateProfileError);
          } else {
            console.log(`Downgraded user ${customerRecord.user_id} to Single Track after subscription cancellation.`);
          }
        }
      } catch (error) {
        console.error('Error handling subscription cancellation event:', error);
      }
      return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
    }
    // --- Fallback: event received ---
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});