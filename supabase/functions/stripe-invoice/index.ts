import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  console.log('Stripe invoice function invoked with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 405 
      });
    }

    console.log('Parsing request body...');
    const { proposal_id, amount, client_user_id, metadata = {} } = await req.json();
    console.log('Received parameters:', { proposal_id, amount, client_user_id, metadata: !!metadata });
    
    if (!proposal_id || !amount || !client_user_id) {
      console.log('Missing required parameters');
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    console.log('Setting up clients...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!supabaseUrl || !supabaseKey || !stripeSecret) {
      console.error('Missing environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeSecret, {
      appInfo: {
        name: 'MyBeatFi',
        version: '1.0.0',
      },
    });

    console.log('Looking up Stripe customer...');
    // Look up or create Stripe customer for client_user_id
    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', client_user_id)
      .is('deleted_at', null)
      .maybeSingle();
      
    console.log('Customer lookup result:', { customer: customer ? 'found' : 'not found', error: getCustomerError });
      
    let customerId;
    if (getCustomerError) {
      console.error('Failed to fetch customer info', getCustomerError);
      return new Response(JSON.stringify({ error: 'Failed to fetch customer info' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      });
    }
    
    if (!customer || !customer.customer_id) {
      console.log('Creating new Stripe customer...');
      // Fetch client email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', client_user_id)
        .maybeSingle();
        
      console.log('Profile lookup result:', { profile: profile ? 'found' : 'not found', error: profileError });
        
      if (profileError || !profile?.email) {
        console.error('Could not find client email');
        return new Response(JSON.stringify({ error: 'Could not find client email' }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        });
      }
      
      const newCustomer = await stripe.customers.create({
        email: profile.email,
        metadata: { userId: client_user_id },
      });
      
      await supabase.from('stripe_customers').insert({
        user_id: client_user_id,
        customer_id: newCustomer.id,
      });
      
      customerId = newCustomer.id;
      console.log('Created new customer:', customerId);
    } else {
      customerId = customer.customer_id;
      console.log('Using existing customer:', customerId);
    }

    console.log('Creating Stripe checkout session...');
    // Create Stripe Checkout session directly without product/price creation
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://mybeatfi.io';
    const baseSiteUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
    
    console.log('Using baseSiteUrl:', baseSiteUrl);
    
    // Calculate expires_at - must be within 24 hours from now
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + (23 * 60 * 60); // 23 hours from now (within 24 hour limit)
    console.log('Session expires at:', new Date(expiresAt * 1000).toISOString());
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: metadata.description || `Sync Proposal #${proposal_id}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseSiteUrl}/dashboard?payment=success`,
      cancel_url: `${baseSiteUrl}/dashboard?payment=cancel`,
      metadata: {
        proposal_id,
        ...metadata,
      },
      expires_at: expiresAt,
    });

    console.log('Stripe session created successfully:', session.id);
    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
    
  } catch (error: any) {
    console.error('Stripe invoice function error:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: 'Failed to create Stripe invoice', 
      details: error.message 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500 
    });
  }
}); 