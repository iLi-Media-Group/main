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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: corsHeaders,
      status: 405,
    });
  }

  try {
    const { licenseId, producerId, action, reason } = await req.json();
    if (!licenseId || !producerId || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: corsHeaders,
        status: 400,
      });
    }
    if (!['accept', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date().toISOString();
    let updateResult;
    if (action === 'accept') {
      updateResult = await supabase
        .from('sync_proposals')
        .update({
          renewal_status: 'producer_approved',
          renewal_responded_at: now,
          renewal_reason: null,
        })
        .eq('id', licenseId)
        .eq('proposal_producer_id', producerId);
    } else {
      updateResult = await supabase
        .from('sync_proposals')
        .update({
          renewal_status: 'producer_rejected',
          renewal_responded_at: now,
          renewal_reason: reason || null,
        })
        .eq('id', licenseId)
        .eq('proposal_producer_id', producerId);
    }

    if (updateResult.error) {
      return new Response(JSON.stringify({ error: updateResult.error.message }), {
        headers: corsHeaders,
        status: 500,
      });
    }

    // Notify client of producer's response
    // Fetch client_id for this proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('sync_proposals')
      .select('client_id')
      .eq('id', licenseId)
      .single();
    if (proposal && proposal.client_id) {
      let notifType = action === 'accept' ? 'renewal_approved' : 'renewal_rejected';
      let notifTitle = action === 'accept' ? 'Renewal Approved' : 'Renewal Rejected';
      let notifMsg = action === 'accept'
        ? 'Your sync/custom license renewal request was approved by the producer.'
        : 'Your sync/custom license renewal request was rejected by the producer.';
      await supabase
        .from('notifications')
        .insert([
          {
            user_id: proposal.client_id,
            type: notifType,
            title: notifTitle,
            message: notifMsg,
            data: { licenseId, reason: reason || null },
          },
        ]);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: corsHeaders,
      status: 500,
    });
  }
}); 