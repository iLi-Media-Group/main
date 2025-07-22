import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import Stripe from 'npm:stripe@17.7.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { appInfo: { name: 'Bolt Integration', version: '1.0.0' } });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Find user by email
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, membership_plan')
      .eq('email', email)
      .maybeSingle();

    if (profileError || !profileData) {
      return new Response(JSON.stringify({ error: 'User not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log('Found user:', profileData.id, 'Current plan:', profileData.membership_plan);

    // Check if user has a Stripe customer record
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', profileData.id)
      .maybeSingle();

    if (customerError || !customerData) {
      return new Response(JSON.stringify({ error: 'No Stripe customer found for user' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerData.customer_id,
      status: 'active',
      limit: 1
    });

    if (!subscriptions.data || subscriptions.data.length === 0) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;

    // Map price_id to plan name
    let planName = 'Unknown';
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
    }

    console.log('Subscription price ID:', priceId, 'Mapped to plan:', planName);

    // Update membership plan
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ membership_plan: planName })
      .eq('id', profileData.id);

    if (updateError) {
      console.error('Error updating membership plan:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update membership plan' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log('Successfully updated membership plan to:', planName);

    return new Response(JSON.stringify({ 
      success: true, 
      oldPlan: profileData.membership_plan,
      newPlan: planName,
      subscriptionId: subscription.id,
      priceId: priceId
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in fix-membership-plan:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}); 