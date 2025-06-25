import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { proposal_id } = await req.json();
    console.log('Received proposal_id:', proposal_id);
    
    if (!proposal_id) {
      return new Response(JSON.stringify({ error: 'Missing proposal_id' }), { headers: corsHeaders, status: 400 });
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
      
    console.log('Proposal query result:', { proposal, error: proposalError });
      
    if (proposalError || !proposal) {
      console.error('Proposal not found or error:', proposalError);
      return new Response(JSON.stringify({ error: 'Proposal not found', details: proposalError }), { headers: corsHeaders, status: 404 });
    }

    // Fetch track and producer data separately
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
      
    console.log('Track query result:', { track, error: trackError });
    
    if (trackError || !track) {
      console.error('Track not found:', trackError);
      return new Response(JSON.stringify({ error: 'Track not found', details: trackError }), { headers: corsHeaders, status: 404 });
    }

    // Check if proposal is already accepted by both parties
    if (proposal.status !== 'accepted' || proposal.client_status !== 'accepted') {
      return new Response(JSON.stringify({ error: 'Proposal must be accepted by both parties before creating invoice' }), { headers: corsHeaders, status: 400 });
    }

    // Check if payment is already pending or paid
    if (proposal.payment_status === 'pending' || proposal.payment_status === 'paid') {
      return new Response(JSON.stringify({ error: 'Payment already processed for this proposal' }), { headers: corsHeaders, status: 400 });
    }

    if (!proposal.sync_fee || !proposal.client_id) {
      return new Response(JSON.stringify({ error: 'Proposal missing sync fee or client' }), { headers: corsHeaders, status: 400 });
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

    // Call the stripe-invoice function
    const stripeInvoiceUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/stripe-invoice`;
    const invoiceRes = await fetch(stripeInvoiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
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
      })
    });
    
    const invoiceData = await invoiceRes.json();
    if (!invoiceRes.ok) {
      return new Response(JSON.stringify({ error: invoiceData.error || 'Failed to create Stripe invoice' }), { headers: corsHeaders, status: 500 });
    }

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
      return new Response(JSON.stringify({ error: 'Failed to update proposal with payment info' }), { headers: corsHeaders, status: 500 });
    }

    // Send notification to producer about payment pending
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-proposal-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        proposalId: proposal.id,
        action: 'payment_pending',
        trackTitle: track.title,
        producerEmail: track.producer.email
      })
    });

    return new Response(JSON.stringify({ 
      sessionId: invoiceData.sessionId, 
      url: invoiceData.url,
      message: 'Invoice created successfully'
    }), { headers: corsHeaders });
    
  } catch (error) {
    console.error('Error in trigger-proposal-payment:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 });
  }
}); 