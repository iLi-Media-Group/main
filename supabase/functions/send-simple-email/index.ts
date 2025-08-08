import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "true",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { to, subject, html, text } = await req.json();

    if (!to || !subject || (!html && !text)) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try Gmail SMTP with retry logic
    let emailSent = false;
    let lastError = null;

    // Try port 465 first (more reliable)
    try {
      const gmailUser = Deno.env.get("GMAIL_USER");
      const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

      if (!gmailUser || !gmailPassword) {
        throw new Error("Gmail credentials not set");
      }

      const client = new SmtpClient();
      await client.connectTLS({
        hostname: "smtp.gmail.com",
        port: 465, // Gmail secure TLS
        username: gmailUser,
        password: gmailPassword,
      });

      await client.send({
        from: gmailUser,
        to,
        subject,
        content: text || html,
        html,
      });

      await client.close();
      emailSent = true;
      console.log("Email sent successfully via Gmail SMTP (port 465)");
      
    } catch (error) {
      console.error("Gmail SMTP failed on port 465:", error.message);
      lastError = error;
      
      // Try port 587 as fallback
      try {
        const gmailUser = Deno.env.get("GMAIL_USER");
        const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

        const client = new SmtpClient();
        await client.connectTLS({
          hostname: "smtp.gmail.com",
          port: 587, // Alternative port
          username: gmailUser,
          password: gmailPassword,
        });

        await client.send({
          from: gmailUser,
          to,
          subject,
          content: text || html,
          html,
        });

        await client.close();
        emailSent = true;
        console.log("Email sent successfully via Gmail SMTP (port 587)");
        
      } catch (fallbackError) {
        console.error("Gmail SMTP failed on port 587:", fallbackError.message);
        lastError = fallbackError;
      }
    }

    if (!emailSent) {
      throw new Error(`Gmail SMTP failed: ${lastError?.message || 'Unknown error'}`);
    }

    // Log to DB
    const { error: logError } = await supabase.from("email_logs").insert({
      to_email: to,
      subject,
      sent_at: new Date().toISOString(),
      status: "sent",
      provider: "gmail",
    });

    if (logError) {
      console.error("Logging error:", logError);
    }

    return new Response(
      JSON.stringify({ success: true, provider: "gmail" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
