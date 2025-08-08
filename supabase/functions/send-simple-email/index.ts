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

    let providerUsed = "gmail";

    // Try Gmail first
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
    } catch (gmailErr) {
      console.error("Gmail failed, falling back to SendGrid:", gmailErr.message);
      providerUsed = "sendgrid";

      const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
      if (!sendgridApiKey) {
        throw new Error("SendGrid API key not set");
      }

      const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: Deno.env.get("FROM_EMAIL") || "no-reply@yourdomain.com" },
          subject,
          content: [
            html ? { type: "text/html", value: html } : { type: "text/plain", value: text },
          ],
        }),
      });

      if (!resp.ok) {
        throw new Error(`SendGrid failed: ${await resp.text()}`);
      }
    }

    // Log to DB
    const { error: logError } = await supabase.from("email_logs").insert({
      to_email: to,
      subject,
      sent_at: new Date().toISOString(),
      status: "sent",
      provider: providerUsed,
    });

    if (logError) {
      console.error("Logging error:", logError);
    }

    return new Response(
      JSON.stringify({ success: true, provider: providerUsed }),
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
