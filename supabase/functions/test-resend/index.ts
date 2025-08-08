import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "true",
};

serve(async (req) => {
  console.log('Test Resend function called');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Check environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL");
    
    console.log('Environment check:', {
      hasResendKey: !!resendApiKey,
      hasFromEmail: !!fromEmail,
      resendKeyLength: resendApiKey?.length || 0
    });

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not found" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Test Resend API connectivity
    const testResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail || "noreply@mybeatfi.io",
        to: ["test@example.com"],
        subject: "Test Email",
        html: "<p>This is a test email from Resend API</p>",
      }),
    });

    console.log('Resend API response status:', testResponse.status);
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('Resend API error:', errorText);
      return new Response(JSON.stringify({ 
        error: `Resend API failed: ${errorText}`,
        status: testResponse.status
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await testResponse.json();
    console.log('Resend API success:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Resend API test successful",
        result: result
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Test Resend function error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
