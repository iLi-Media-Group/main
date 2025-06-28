// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
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
      negotiationId,
      action,
      userId,
    } = await req.json();

    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch the negotiation message to get counter details
    const { data: negotiationData, error: negotiationError } = await supabaseClient
      .from('proposal_negotiations')
      .select('counter_offer, counter_terms, sender_id')
      .eq('id', negotiationId)
      .single();

    if (negotiationError) throw new Error('Failed to find the negotiation message.');
    if (!negotiationData) throw new Error('Negotiation message not found.');

    // 2. Fetch the proposal to get participant details
    const { data: proposalData, error: proposalError } = await supabaseClient
      .from('sync_proposals')
      .select('client_id, track:tracks(producer_id)')
      .eq('id', proposalId)
      .single();

    if (proposalError) throw new Error('Failed to fetch proposal details.');
    if (!proposalData) throw new Error('Proposal not found.');

    const producerId = proposalData.track.producer_id;
    const clientId = proposalData.client_id;
    const otherPartyId = userId === producerId ? clientId : producerId;

    // 3. Fetch recipient email
    const { data: recipientProfile, error: recipientError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', otherPartyId)
      .single();

    if (recipientError || !recipientProfile) throw new Error('Could not find recipient to notify.');

    if (action === 'accept') {
      // Update the main proposal with the counter terms
      const { error: updateError } = await supabaseClient
        .from('sync_proposals')
        .update({
          sync_fee: negotiationData.counter_offer,
          payment_terms: negotiationData.counter_terms,
          status: 'pending', // Reset status to pending for final confirmation
          producer_status: 'pending',
          client_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposalId);

      if (updateError) throw updateError;

      // Add a system message to the negotiation history
      await supabaseClient.from('proposal_negotiations').insert({
        proposal_id: proposalId,
        sender_id: userId,
        message: `Accepted the counter-offer of $${negotiationData.counter_offer}.`,
        is_system_message: true,
      });

      // Notify the other party
      await supabaseClient.auth.admin.sendRawEmail({
        email: recipientProfile.email,
        subject: 'Counter-Offer Accepted!',
        template: `<p>Your counter-offer has been accepted. Please review the updated proposal and proceed with the final confirmation in your dashboard.</p>`,
      });

    } else if (action === 'decline') {
      // Add a system message for the declination
      await supabaseClient.from('proposal_negotiations').insert({
        proposal_id: proposalId,
        sender_id: userId,
        message: 'Declined the counter-offer.',
        is_system_message: true,
      });

      // Notify the other party
      await supabaseClient.auth.admin.sendRawEmail({
        email: recipientProfile.email,
        subject: 'Counter-Offer Declined',
        template: `<p>Your recent counter-offer was declined. Please check your dashboard to continue the negotiation.</p>`,
      });
    }

    return new Response(
      JSON.stringify({ message: `Counter-offer ${action}ed successfully.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});