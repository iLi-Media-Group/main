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
  console.log('Service onboarding email function called');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { to, email, type } = await req.json();
    console.log('Received data:', { to, email, type });

    if (!to || !email || !type) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, email, and type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Construct the public onboarding link
    const baseUrl = Deno.env.get("SITE_URL") || "https://mybeatfi.io";
    const link = `${baseUrl}/service-onboarding-public?email=${encodeURIComponent(email)}&type=${encodeURIComponent(type)}`;

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error('Missing Resend API key');
      return new Response(JSON.stringify({ error: "Resend API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Sending service onboarding email via Resend API...');

    const subject = "Welcome to MyBeatFi - Add Your Service";
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to MyBeatFi</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to MyBeatFi!</h1>
            <p>We're excited to have you join our community of service providers</p>
          </div>
          <div class="content">
            <h2>Add Your Service to MyBeatFi</h2>
            <p>Thank you for your interest in providing services to our music community! We've created a secure link for you to add your service details to our platform.</p>
            
            <p><strong>What you can add:</strong></p>
            <ul>
              <li>Recording Studios</li>
              <li>Recording Engineers</li>
              <li>Graphic Artists</li>
              <li>And more!</li>
            </ul>
            
            <p>Click the button below to get started:</p>
            
            <div style="text-align: center;">
              <a href="${link}" class="button">Add Your Service</a>
            </div>
            
            <p><strong>Important:</strong> This link will expire in 3 days for security reasons. If you need a new link, please contact us.</p>
            
            <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>© 2024 MyBeatFi. All rights reserved.</p>
            <p>This email was sent to ${to}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to MyBeatFi!

We're excited to have you join our community of service providers.

Add Your Service to MyBeatFi

Thank you for your interest in providing services to our music community! We've created a secure link for you to add your service details to our platform.

What you can add:
- Recording Studios
- Recording Engineers
- Graphic Artists
- And more!

Click the link below to get started:
${link}

Important: This link will expire in 3 days for security reasons. If you need a new link, please contact us.

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

© 2024 MyBeatFi. All rights reserved.
This email was sent to ${to}
    `;

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
      email_type: "service_onboarding"
    });

    if (logError) {
      console.error("Logging error:", logError);
    }

    console.log('Service onboarding email sent and logged successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Service onboarding email sent successfully via Resend",
        to: to,
        subject: subject,
        provider: "resend"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Service onboarding email function error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
