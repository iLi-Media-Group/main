import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Function to fetch the uploaded PDF from storage
async function getWelcomePDF() {
  const pdfUrl = "https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/welcome-guides/mybeatfiwelcomeguideprod.pdf";
  
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    const pdfBuffer = await response.arrayBuffer();
    return new Uint8Array(pdfBuffer);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    throw error;
  }
}

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Handle POST requests (including test PDF generation)
    if (req.method === 'POST') {
      const body = await req.json();
      const { email, first_name, account_type = 'client', isTest } = body;

      // If this is a test request, return the PDF data
      if (isTest) {
        console.log('Test PDF request for:', account_type);
        
        try {
          const pdfBytes = await getWelcomePDF();
          const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
          
          return new Response(JSON.stringify({
            success: true,
            pdfBase64: pdfBase64,
            message: 'PDF fetched successfully'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: error.message,
            message: 'Failed to fetch PDF'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Regular email sending logic
    if (!email) {
      console.error('Email is required');
      return new Response("Email is required", { 
        status: 400,
        headers: corsHeaders
      });
    }
    
      console.log('Welcome email request received:', { email, first_name, account_type });
      
      // Fetch the PDF from storage
      const pdfBytes = await getWelcomePDF();
      const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));

    // Customize email content based on account type
    let subject = `Welcome to MyBeatFi, ${first_name || 'there'}!`;
    let welcomeMessage = "Thanks for signing up. You're now part of a global community of creatives ready to license, sync, and discover incredible music.";
    
    if (account_type === 'producer') {
      subject = `Welcome to MyBeatFi Producer Network, ${first_name || 'there'}!`;
      welcomeMessage = "Congratulations on joining the MyBeatFi Producer Network! You're now part of an exclusive community of talented producers ready to license your music worldwide.";
    } else if (account_type === 'artist_band') {
      subject = `Welcome to MyBeatFi Artist Network, ${first_name || 'there'}!`;
      welcomeMessage = "Welcome to the MyBeatFi Artist Network! You're now part of a community of artists and bands ready to license your music for sync opportunities.";
    } else if (account_type === 'rights_holder') {
      subject = `Welcome to MyBeatFi Rights Holder Network, ${first_name || 'there'}!`;
      welcomeMessage = "Welcome to the MyBeatFi Rights Holder Network! You're now part of a community of record labels and publishers managing music licensing.";
    }

    const html = `<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #ffffff;
        color: #333333;
        padding: 40px;
        margin: 0;
      }
      .container {
        max-width: 600px;
        margin: auto;
        background: #ffffff;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
        color: #1f2937;
      }
      .body-text {
        margin: 20px 0;
        line-height: 1.6;
        color: #374151;
      }
      .button {
        display: inline-block;
        background: #3b82f6;
        color: white !important;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: bold;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #6b7280;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
             <div class="header">
         <img class="logo" src="https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1753301925481" alt="MyBeatFi Logo" />
         <div class="title">Welcome to MyBeatFi.io, ${first_name || 'there'}!</div>
       </div>
      <div class="body-text">
        ${welcomeMessage}
        <br /><br />
        Your welcome guide is attached as a PDF. We recommend reading it to understand how to get started.
        <br /><br />
        When you're ready, click below to explore your dashboard.
      </div>
      <div style="text-align: center;">
        <a href="${account_type === 'client' ? 'https://mybeatfi.io/catalog' : 'https://mybeatfi.io/dashboard'}" class="button">${account_type === 'client' ? 'Browse the Catalog' : 'Go to Dashboard'}</a>
      </div>
      ${account_type === 'client' ? `
      <div class="body-text" style="text-align: center; margin-top: 30px;">
        We're glad you're here. Let's make something amazing together.<br/><br/>
        — The MyBeatFi Team
      </div>
      ` : ''}
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`;

    console.log('Sending email via Resend...');
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MyBeatFi <welcome@mybeatfi.io>",
        to: email,
        subject: subject,
        html,
        attachments: [
          {
            filename: "Welcome-Guide.pdf",
            content: pdfBase64,
            type: "application/pdf",
          },
        ],
        tags: [{ name: "signup", value: "new_user" }, { name: "account_type", value: account_type }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Email send failed:", errorText);
      return new Response(`Failed to send welcome email: ${errorText}`, { 
        status: 500,
        headers: corsHeaders
      });
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    return new Response("Welcome email sent!", { 
      status: 200,
      headers: corsHeaders
    });
    }

    // Handle GET requests
    return new Response("Welcome email service is running. Use POST to send emails.", {
      status: 200,
      headers: corsHeaders
    });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(`Error: ${err.message}`, { 
      status: 500,
      headers: corsHeaders
    });
  }
}); 