import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib";

async function generateWelcomePDF(firstName: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const date = new Date().toLocaleDateString();

  page.drawText(`Welcome to MyBeatFi.io, ${firstName || 'there'}!`, {
    x: 50,
    y: 780,
    size: 24,
    font,
    color: rgb(0, 0.88, 1),
  });

  page.drawText(`Date: ${date}`, {
    x: 50,
    y: 750,
    size: 12,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText(
    `Thank you for joining MyBeatFi.io!\n\nThis guide will help you get started.\n\n- Explore premium beats\n- License music for your projects\n- Connect with top producers\n\nVisit your dashboard to begin your journey!`,
    { x: 50, y: 700, size: 14, font, color: rgb(0, 0, 0) }
  );

  // ...add more content as needed...

  return await pdfDoc.save();
}

serve(async (req) => {
  try {
    // Handle test requests
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const testEmail = url.searchParams.get('test_email');
      
      if (testEmail) {
        console.log('Test welcome email request for:', testEmail);
        
        const pdfBytes = await generateWelcomePDF('Test User');
        const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

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
      }
      .body-text {
        margin: 20px 0;
        line-height: 1.6;
      }
      .button {
        display: inline-block;
        background: #3b82f6;
        color: white;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: bold;
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
        <div class="title">Welcome to MyBeatFi.io, Test User!</div>
      </div>
      <div class="body-text">
        This is a test welcome email to verify the email system is working correctly.
        <br /><br />
        Your custom welcome guide is attached as a PDF. We recommend reading it to understand how to get started.
        <br /><br />
        When you're ready, click below to explore your dashboard.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/dashboard" class="button">Go to Dashboard</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`;

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "MyBeatFi <welcome@mybeatfi.com>",
            to: testEmail,
            subject: "🧪 Test Welcome Email - MyBeatFi",
            html,
            attachments: [
              {
                filename: "Welcome-Guide.pdf",
                content: pdfBase64,
                type: "application/pdf",
              },
            ],
            tags: [{ name: "test", value: "welcome_email" }]
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Test email send failed:", errorText);
          return new Response(`Test email failed: ${errorText}`, { status: 500 });
        }

        const result = await response.json();
        console.log('Test email sent successfully:', result);
        return new Response("Test welcome email sent!", { status: 200 });
      }
      
      return new Response("Test email parameter required", { status: 400 });
    }

    const { email, first_name, account_type = 'client' } = await req.json();
    
    console.log('Welcome email request received:', { email, first_name, account_type });
    
    if (!email) {
      console.error('Email is required');
      return new Response("Email is required", { status: 400 });
    }
    
    const pdfBytes = await generateWelcomePDF(first_name);
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    // Customize email content based on account type
    let subject = `🎉 Welcome to MyBeatFi, ${first_name || 'there'}!`;
    let welcomeMessage = "Thanks for signing up. You're now part of a global community of creatives ready to license, sync, and discover incredible music.";
    
    if (account_type === 'producer') {
      subject = `🎵 Welcome to MyBeatFi Producer Network, ${first_name || 'there'}!`;
      welcomeMessage = "Congratulations on joining the MyBeatFi Producer Network! You're now part of an exclusive community of talented producers ready to license your music worldwide.";
    } else if (account_type === 'artist_band') {
      subject = `🎤 Welcome to MyBeatFi Artist Network, ${first_name || 'there'}!`;
      welcomeMessage = "Welcome to the MyBeatFi Artist Network! You're now part of a community of artists and bands ready to license your music for sync opportunities.";
    } else if (account_type === 'rights_holder') {
      subject = `🏢 Welcome to MyBeatFi Rights Holder Network, ${first_name || 'there'}!`;
      welcomeMessage = "Welcome to the MyBeatFi Rights Holder Network! You're now part of a community of record labels and publishers managing music licensing.";
    }

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
      }
      .body-text {
        margin: 20px 0;
        line-height: 1.6;
      }
      .button {
        display: inline-block;
        background: #3b82f6;
        color: white;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: bold;
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
        <div class="title">Welcome to MyBeatFi.io, ${first_name || 'there'}!</div>
      </div>
      <div class="body-text">
        ${welcomeMessage}
        <br /><br />
        Your custom welcome guide is attached as a PDF. We recommend reading it to understand how to get started.
        <br /><br />
        When you're ready, click below to explore your dashboard.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/dashboard" class="button">Go to Dashboard</a>
      </div>
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
        from: "MyBeatFi <welcome@mybeatfi.com>",
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
      return new Response(`Failed to send welcome email: ${errorText}`, { status: 500 });
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    return new Response("Welcome email sent!", { status: 200 });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(`Error sending email: ${err.message}`, { status: 500 });
  }
}); 