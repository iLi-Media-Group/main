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
      uploaderId,
      fileName,
      fileUrl,
      fileType,
      fileSize,
      recipientEmail
    } = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Record file share
    const { error: fileError } = await supabaseClient
      .from('proposal_files')
      .insert({
        proposal_id: proposalId,
        uploader_id: uploaderId,
        file_name: fileName,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize
      });

    if (fileError) throw fileError;

    // Removed unsupported email notification code

    return new Response(
      JSON.stringify({ message: 'File share processed successfully' }),
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
