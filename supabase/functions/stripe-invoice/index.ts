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
    const { proposal_id, amount, client_user_id, payment_due_date, metadata = {} } = await req.json();
    console.log('Received parameters:', { proposal_id, amount, client_user_id, payment_due_date: !!payment_due_date, metadata: !!metadata });
    
    if (!proposal_id || !amount || !client_user_id) {
      console.log('Missing required parameters');
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    console.log('Creating Supabase client...');
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

    console.log('Creating Stripe product...');
    // Create a product/price for the proposal
    const product = await stripe.products.create({
      name: metadata.description || `Sync Proposal #${proposal_id}`,
      metadata: { proposal_id },
    });
    
    console.log('Creating Stripe price...');
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount,
      currency: 'usd',
    });

    console.log('Creating Stripe checkout session...');
    // Create Stripe Checkout session
    const siteUrl = Deno.env.get('SITE_URL') ?? '';
    console.log('SITE_URL from env:', siteUrl);
    
    // Ensure we have a valid base URL
    let baseSiteUrl;
    if (!siteUrl) {
      baseSiteUrl = 'https://mybeatfi.io'; // Fallback to production URL
      console.log('No SITE_URL found, using fallback:', baseSiteUrl);
    } else if (siteUrl.startsWith('http')) {
      baseSiteUrl = siteUrl;
      console.log('Using SITE_URL as is:', baseSiteUrl);
    } else {
      baseSiteUrl = `https://${siteUrl}`;
      console.log('Adding https:// to SITE_URL:', baseSiteUrl);
    }
    
    console.log('Final baseSiteUrl:', baseSiteUrl);
    console.log('Success URL will be:', `${baseSiteUrl}/dashboard?payment=success`);
    console.log('Cancel URL will be:', `${baseSiteUrl}/dashboard?payment=cancel`);
    
    // Calculate expires_at - must be within 24 hours from now
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + (23 * 60 * 60); // 23 hours from now (within 24 hour limit)
    console.log('Session expires at:', new Date(expiresAt * 1000).toISOString());
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: metadata.success_url || `${baseSiteUrl}/dashboard?payment=success`,
      cancel_url: metadata.cancel_url || `${baseSiteUrl}/dashboard?payment=cancel`,
      metadata: {
        proposal_id,
        ...metadata,
      },
      expires_at: expiresAt, // Use calculated timestamp within 24 hours
    });

    console.log('Stripe session created successfully:', session.id);
    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
    
  } catch (error: any) {
    console.error('Stripe invoice function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500 
    });
  }
}); 