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
    const {
      proposalId,
      senderId,
      message,
      counterOffer,
      counterTerms,
      counterPaymentTerms,
      recipientEmail
    } = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch proposal to determine sender role
    const { data: proposal, error: proposalError } = await supabaseClient
      .from('sync_proposals')
      .select('client_id, track:tracks(track_producer_id)')
      .eq('id', proposalId)
      .single();
    if (proposalError || !proposal) throw new Error('Could not fetch proposal for negotiation.');

    const producerId = proposal.track?.track_producer_id;
    const clientId = proposal.client_id;
    let statusToSet = 'negotiating';
    const hasCounterOffer = counterOffer || counterTerms || counterPaymentTerms;
    if (hasCounterOffer) {
      if (senderId === clientId) {
        statusToSet = 'producer_acceptance_required';
      } else if (senderId === producerId) {
        statusToSet = 'client_acceptance_required';
      }
    }

    // Create negotiation record
    const { error: negotiationError } = await supabaseClient
      .from('proposal_negotiations')
      .insert({
        proposal_id: proposalId,
        sender_id: senderId,
        message,
        counter_offer: counterOffer,
        counter_terms: counterTerms,
        counter_payment_terms: counterPaymentTerms
      });
    if (negotiationError) throw negotiationError;

    // Update proposal status and mark as unread for the recipient
    const updateData: any = {
      last_message_sender_id: senderId,
      last_message_at: new Date().toISOString(),
      negotiation_status: statusToSet
    };
    const { error: statusError } = await supabaseClient
      .from('sync_proposals')
      .update(updateData)
      .eq('id', proposalId);
    if (statusError) throw statusError;

    // Send email notification
    const { error: emailError } = await supabaseClient.auth.admin.sendRawEmail({
      email: recipientEmail,
      subject: hasCounterOffer ? 'New Counter-Offer Received' : 'New Negotiation Message',
      template: `
        <p>You have received a ${hasCounterOffer ? 'new counter-offer' : 'new message'} for your sync proposal.</p>
        <p>Message: ${message}</p>
        ${counterOffer ? `<p>Counter Offer: $${counterOffer}</p>` : ''}
        ${counterTerms ? `<p>Proposed Terms: ${counterTerms}</p>` : ''}
        ${counterPaymentTerms ? `<p>Counter Payment Terms: ${counterPaymentTerms}</p>` : ''}
        <p>Please log in to your dashboard to review and respond.</p>
      `
    });
    if (emailError) throw emailError;

    return new Response(
      JSON.stringify({ message: 'Negotiation processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
