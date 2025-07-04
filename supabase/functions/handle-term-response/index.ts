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
      userType, // 'client' or 'producer'
      termsResponse, // {amount: true/false, payment_terms: true/false, exclusivity: true/false}
      message = '',
      recipientEmail
    } = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call the database function to handle term response
    const { error: termResponseError } = await supabaseClient
      .rpc('handle_term_response', {
        p_proposal_id: proposalId,
        p_user_id: senderId,
        p_user_type: userType,
        p_terms_response: termsResponse
      });

    if (termResponseError) throw termResponseError;

    // Send email notification
    const { error: emailError } = await supabaseClient.auth.admin.sendRawEmail({
      email: recipientEmail,
      subject: 'New Term Response Received',
      template: `
        <p>You have received a new term response for your sync proposal.</p>
        <p>Message: ${message || 'No additional message provided'}</p>
        <p>Term Response: ${JSON.stringify(termsResponse, null, 2)}</p>
        <p>Please log in to your dashboard to review and respond.</p>
      `
    });

    if (emailError) throw emailError;

    return new Response(
      JSON.stringify({ 
        message: 'Term response processed successfully',
        termsUpdated: true
      }),
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