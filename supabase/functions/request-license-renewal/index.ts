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
    const { licenseType, licenseId, userId } = await req.json();
    if (!licenseType || !licenseId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let updateResult;
    const now = new Date().toISOString();
    let notificationResult;
    if (licenseType === 'regular') {
      // Update sales table
      updateResult = await supabase
        .from('sales')
        .update({
          renewal_status: 'pending',
          renewal_requested_at: now,
        })
        .eq('id', licenseId)
        .eq('buyer_id', userId);
      // Optionally notify client (self)
      notificationResult = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            type: 'renewal_request',
            title: 'Renewal Requested',
            message: 'Your license renewal request has been received.',
            data: { licenseId },
          },
        ]);
    } else if (licenseType === 'sync') {
      // Update sync_proposals table
      updateResult = await supabase
        .from('sync_proposals')
        .update({
          renewal_status: 'pending_producer',
          renewal_requested_at: now,
        })
        .eq('id', licenseId)
        .eq('client_id', userId);
      // Fetch producer id for notification
      const { data: proposal, error: proposalError } = await supabase
        .from('sync_proposals')
        .select('proposal_producer_id')
        .eq('id', licenseId)
        .single();
      if (proposal && proposal.proposal_producer_id) {
        notificationResult = await supabase
          .from('notifications')
          .insert([
            {
              user_id: proposal.proposal_producer_id,
              type: 'renewal_request',
              title: 'Renewal Request',
              message: 'A client has requested to renew a sync/custom license.',
              data: { licenseId, clientId: userId },
            },
          ]);
      }
    } else {
      return new Response(JSON.stringify({ error: 'Invalid licenseType' }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    if (updateResult.error) {
      return new Response(JSON.stringify({ error: updateResult.error.message }), {
        headers: corsHeaders,
        status: 500,
      });
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