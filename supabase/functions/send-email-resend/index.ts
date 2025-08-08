import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "true",
};

serve(async (req) => {
  console.log('Resend email function called');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { to, subject, html, text } = await req.json();
    console.log('Received data:', { to, subject, hasHtml: !!html, hasText: !!text });

    if (!to || !subject || (!html && !text)) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error('Missing Resend API key');
      return new Response(JSON.stringify({ error: "Resend API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Sending email via Resend API...');

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("FROM_EMAIL") || "noreply@mybeatfi.io",
        to: [to],
        subject: subject,
        html: html,
        text: text,
      }),
    });

    console.log('Resend API response status:', resendResponse.status);

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Resend failed: ${errorText}`);
    }

    const resendResult = await resendResponse.json();
    console.log('Resend success:', resendResult);

    // Create Supabase client for logging
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return new Response(JSON.stringify({ error: "Supabase credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log to DB
    const { error: logError } = await supabase.from("email_logs").insert({
      to_email: to,
      subject,
      sent_at: new Date().toISOString(),
      status: "sent",
      provider: "resend",
    });

    if (logError) {
      console.error("Logging error:", logError);
    }

    console.log('Email sent and logged successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully via Resend",
        to: to,
        subject: subject,
        provider: "resend"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Email function error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
