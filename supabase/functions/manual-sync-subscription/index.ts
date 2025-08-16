import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { customerId } = await req.json();

    if (!customerId) {
      return new Response('Customer ID is required', { status: 400 });
    }

    console.log(`Manual sync requested for customer: ${customerId}`);

    // Fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    console.log(`Found ${subscriptions.data.length} subscriptions for customer ${customerId}`);

    if (subscriptions.data.length === 0) {
      console.log(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        return new Response(JSON.stringify({ error: 'Failed to update subscription status' }), { status: 500 });
      }

      return new Response(JSON.stringify({ message: 'No subscriptions found, marked as not_started' }));
    }

    // Get the first subscription
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    
    console.log(`Subscription details:`, {
      id: subscription.id,
      priceId,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end
    });

    // Map price_id to plan name
    let planName = 'Unknown';
    switch (priceId) {
      case 'price_1RvLLRA4Yw5viczUCAGuLpKh':
        planName = 'Ultimate Access';
        break;
      case 'price_1RvLKcA4Yw5viczUItn56P2m':
        planName = 'Platinum Access';
        break;
      case 'price_1RvLJyA4Yw5viczUwdHhIYAQ':
        planName = 'Gold Access';
        break;
      case 'price_1RvLJCA4Yw5viczUrWeCZjom':
        planName = 'Single Track';
        break;
      default:
        planName = 'Unknown';
    }

    // Store subscription state in stripe_subscriptions (trigger will sync to subscriptions)
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: priceId,
        plan_name: planName,
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
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      return new Response(JSON.stringify({ error: 'Failed to sync subscription in database' }), { status: 500 });
    }

    console.log(`Successfully synced subscription for customer: ${customerId}`);
    return new Response(JSON.stringify({ 
      message: 'Subscription synced successfully',
      subscription: {
        id: subscription.id,
        priceId,
        planName,
        status: subscription.status
      }
    }));

  } catch (error: any) {
    console.error('Error in manual sync:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}); 