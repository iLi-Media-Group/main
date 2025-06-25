import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://mybeatfi.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  console.log('Function invoked with method:', req.method);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    console.log('Parsing request body...');
    const { proposal_id } = await req.json();
    console.log('Received proposal_id:', proposal_id);
    
    if (!proposal_id) {
      console.log('Missing proposal_id, returning 400');
      return new Response(JSON.stringify({ error: 'Missing proposal_id' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    console.log('Creating Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      });
    }

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Look up the proposal with all necessary fields
    console.log('Querying proposal with ID:', proposal_id);
    const { data: proposal, error: proposalError } = await supabaseClient
      .from('sync_proposals')
      .select(`
        id, 
        sync_fee, 
        client_id, 
        payment_terms,
        payment_status, 
        status,
        client_status,
        created_at,
        track_id
      `)
      .eq('id', proposal_id)
      .single();
      
    console.log('Proposal query result:', { proposal: proposal ? 'found' : 'not found', error: proposalError });
      
    if (proposalError || !proposal) {
      console.error('Proposal not found or error:', proposalError);
      return new Response(JSON.stringify({ error: 'Proposal not found', details: proposalError }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 404 
      });
    }

    // Fetch track and producer data separately
    console.log('Fetching track data...');
    const { data: track, error: trackError } = await supabaseClient
      .from('tracks')
      .select(`
        title,
        producer:profiles!inner (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', proposal.track_id)
      .single();
      
    console.log('Track query result:', { track: track ? 'found' : 'not found', error: trackError });
    
    if (trackError || !track) {
      console.error('Track not found:', trackError);
      return new Response(JSON.stringify({ error: 'Track not found', details: trackError }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 404 
      });
    }

    // Check if proposal is already accepted by both parties
    if (proposal.status !== 'accepted' || proposal.client_status !== 'accepted') {
      return new Response(JSON.stringify({ error: 'Proposal must be accepted by both parties before creating invoice' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    // Check if payment is already completed
    if (proposal.payment_status === 'paid') {
      return new Response(JSON.stringify({ error: 'Payment already completed for this proposal' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    if (!proposal.sync_fee || !proposal.client_id) {
      return new Response(JSON.stringify({ error: 'Proposal missing sync fee or client' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    // Calculate payment due date based on payment terms
    const acceptanceDate = new Date(proposal.created_at || new Date().toISOString());
    let paymentDueDate = new Date(acceptanceDate);
    
    switch (proposal.payment_terms) {
      case 'net30':
        paymentDueDate.setDate(acceptanceDate.getDate() + 30);
        break;
      case 'net60':
        paymentDueDate.setDate(acceptanceDate.getDate() + 60);
        break;
      case 'net90':
        paymentDueDate.setDate(acceptanceDate.getDate() + 90);
        break;
      case 'immediate':
      default:
        // For immediate payment, due date is the same as acceptance date
        paymentDueDate = new Date(acceptanceDate);
        break;
    }

    console.log('Calling stripe-invoice function...');
    // Call the stripe-invoice function
    const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
    const stripeInvoiceUrl = `${baseUrl}/functions/v1/stripe-invoice`;
    console.log('Calling stripe-invoice function at:', stripeInvoiceUrl);
    
    const requestPayload = {
      proposal_id,
      amount: Math.round(proposal.sync_fee * 100), // Convert to cents
      client_user_id: proposal.client_id,
      payment_due_date: paymentDueDate.toISOString(),
      metadata: {
        description: `Sync license for "${track.title}"`,
        track_title: track.title,
        producer_name: `${track.producer.first_name} ${track.producer.last_name}`,
        payment_terms: proposal.payment_terms || 'immediate'
      }
    };
    
    console.log('Request payload:', requestPayload);
    
    const invoiceRes = await fetch(stripeInvoiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify(requestPayload)
    });
    
    console.log('Stripe invoice response status:', invoiceRes.status);
    
    if (!invoiceRes.ok) {
      const errorText = await invoiceRes.text();
      console.error('Stripe invoice creation failed:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to create Stripe invoice', details: errorText }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      });
    }
    
    const invoiceData = await invoiceRes.json();
    console.log('Stripe invoice response data:', invoiceData);

    console.log('Updating proposal with payment info...');
    // Update the proposal with session info and set payment_status to pending
    const { error: updateError } = await supabaseClient
      .from('sync_proposals')
      .update({
        stripe_checkout_session_id: invoiceData.sessionId,
        payment_status: 'pending',
        payment_due_date: paymentDueDate.toISOString(),
      })
      .eq('id', proposal_id);
      
    if (updateError) {
      console.error('Failed to update proposal:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update proposal with payment info' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      });
    }

    console.log('Sending notification...');
    // Send notification to producer about payment pending
    const notifyUrl = `${baseUrl}/functions/v1/notify-proposal-update`;
    try {
      await fetch(notifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          action: 'payment_pending',
          trackTitle: track.title,
          producerEmail: track.producer.email
        })
      });
    } catch (notifyError) {
      console.error('Failed to send notification (non-critical):', notifyError);
      // Don't fail the whole request if notification fails
    }

    console.log('Returning success response');
    return new Response(JSON.stringify({ 
      sessionId: invoiceData.sessionId, 
      url: invoiceData.url,
      message: 'Invoice created successfully'
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
    
  } catch (error) {
    console.error('Error in trigger-proposal-payment:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500 
    });
  }
}); 