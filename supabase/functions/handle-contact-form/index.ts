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
    const { name, email, subject, message } = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Try to insert into contact_messages table (optional - table might not exist yet)
    try {
      const { error: insertError } = await supabaseClient
        .from('contact_messages')
        .insert({
          name,
          email,
          subject,
          message,
          status: 'unread'
        });

      if (insertError) {
        console.warn("Could not insert into contact_messages table:", insertError);
        // Continue with email sending even if database insert fails
      }
    } catch (dbError) {
      console.warn("Database insert failed:", dbError);
      // Continue with email sending even if database insert fails
    }

    // Check if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured. Please contact support.");
    }

    // Send email notification using Resend
    const html = `<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #111827;
        color: #f9fafb;
        padding: 40px;
      }
      .container {
        max-width: 600px;
        margin: auto;
        background: #1f2937;
        border-radius: 8px;
        padding: 30px;
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
      }
      .logo {
        max-width: 150px;
        margin-bottom: 10px;
      }
      .title {
        font-size: 22px;
        font-weight: bold;
        color: #3b82f6;
      }
      .body-text {
        margin: 20px 0;
        line-height: 1.6;
      }
      .contact-info {
        background: #374151;
        padding: 20px;
        border-radius: 6px;
        margin: 20px 0;
      }
      .contact-info p {
        margin: 8px 0;
      }
      .message-content {
        background: #374151;
        padding: 20px;
        border-radius: 6px;
        margin: 20px 0;
        white-space: pre-wrap;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #9ca3af;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img class="logo" src="https://mybeatfi.io/logo.png" alt="MyBeatFi Logo" />
        <div class="title">New Contact Form Submission</div>
      </div>
      <div class="body-text">
        You have received a new contact form submission from the MyBeatFi website.
      </div>
      <div class="contact-info">
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
      </div>
      <div class="message-content">
        ${message.replace(/\n/g, '<br>')}
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`;

    console.log("Attempting to send email...");
    console.log("From: MyBeatFi <onboarding@resend.dev>");
    console.log("To: contactmybeatfi@gmail.com");
    console.log("Subject:", `New Contact Form: ${subject}`);
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MyBeatFi <onboarding@resend.dev>",
        to: "contactmybeatfi@gmail.com",
        subject: `New Contact Form: ${subject}`,
        html,
        tags: [{ name: "contact_form", value: "new_submission" }]
      }),
    });
    
    console.log("Email response status:", emailResponse.status);

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Email send failed:", errorText);
      console.error("Response status:", emailResponse.status);
      console.error("Response headers:", Object.fromEntries(emailResponse.headers.entries()));
      
      // Check if it's a Resend API key issue
      if (emailResponse.status === 401) {
        throw new Error("Email service not configured. Please contact support.");
      } else {
        throw new Error(`Failed to send email notification: ${emailResponse.status}`);
      }
    }

    return new Response(
      JSON.stringify({ message: 'Contact form submitted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
