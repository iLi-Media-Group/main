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
    if (!proposal_id) {
      return new Response(JSON.stringify({ error: 'Missing proposal_id' }), { headers: corsHeaders, status: 400 });
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Look up the proposal
    const { data: proposal, error: proposalError } = await supabaseClient
      .from('sync_proposals')
      .select('id, final_amount, client_id, payment_due_date, payment_status, status')
      .eq('id', proposal_id)
      .single();
    if (proposalError || !proposal) {
      return new Response(JSON.stringify({ error: 'Proposal not found' }), { headers: corsHeaders, status: 404 });
    }

    // Ensure both parties have accepted (status should be 'accepted' or similar)
    if (proposal.status === 'accepted') {
      return;
    }
    if (!proposal.final_amount || !proposal.client_id) {
      return new Response(JSON.stringify({ error: 'Proposal missing final amount or client' }), { headers: corsHeaders, status: 400 });
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
        amount: proposal.final_amount,
        client_user_id: proposal.client_id,
        payment_due_date: proposal.payment_due_date
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
        payment_due_date: proposal.payment_due_date,
      })
      .eq('id', proposal_id);
    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to update proposal with payment info' }), { headers: corsHeaders, status: 500 });
    }

    if (proposal.status !== 'accepted') {
      await supabaseClient
        .from('proposal_history')
        .insert({
          proposal_id: proposal.id,
          previous_status: proposal.status,
          new_status: 'accepted',
          changed_by: proposal.client_id
        });
    }

    return new Response(JSON.stringify({ sessionId: invoiceData.sessionId, url: invoiceData.url }), { headers: corsHeaders });
  } catch (error) {
    console.error('Error in trigger-proposal-payment:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 });
  }
}); 