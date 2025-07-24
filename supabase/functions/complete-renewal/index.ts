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
    const { licenseType, licenseId, userId, newExpiryDate } = await req.json();
    if (!licenseType || !licenseId || !userId || !newExpiryDate) {
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
    let notificationResult;
    if (licenseType === 'regular') {
      // Update sales table
      updateResult = await supabase
        .from('sales')
        .update({
          expiry_date: newExpiryDate,
          renewal_status: 'none',
          renewal_requested_at: null,
          renewal_approved_at: null,
          renewal_rejected_at: null,
          renewal_reason: null,
          renewal_payment_id: null,
        })
        .eq('id', licenseId)
        .eq('buyer_id', userId);
      // Notify client
      notificationResult = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            type: 'renewal_complete',
            title: 'License Renewed',
            message: 'Your license has been successfully renewed.',
            data: { licenseId, newExpiryDate },
          },
        ]);
    } else if (licenseType === 'sync') {
      // Update sync_proposals table
      updateResult = await supabase
        .from('sync_proposals')
        .update({
          payment_due_date: newExpiryDate,
          renewal_status: 'none',
          renewal_requested_at: null,
          renewal_responded_at: null,
          renewal_reason: null,
          renewal_payment_id: null,
        })
        .eq('id', licenseId)
        .eq('client_id', userId);
      // Notify client
      notificationResult = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            type: 'renewal_complete',
            title: 'License Renewed',
            message: 'Your sync/custom license has been successfully renewed.',
            data: { licenseId, newExpiryDate },
          },
        ]);
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