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
      licenseId,
      licenseeEmail,
      licenseeInfo,
      trackTitle,
      licenseType,
      pdfUrl
    } = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store license agreement in database
    const { error: dbError } = await supabaseClient
      .from('license_agreements')
      .insert({
        license_id: licenseId,
        type: licenseType,
        pdf_url: pdfUrl,
        licensee_info: licenseeInfo,
        sent_at: new Date().toISOString()
      });

    if (dbError) throw dbError;

    console.log(`License agreement stored for ${licenseType} license: ${licenseId}`);

    return new Response(
      JSON.stringify({ 
        message: 'License agreement processed successfully',
        pdfUrl: pdfUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handle-license-agreement:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
