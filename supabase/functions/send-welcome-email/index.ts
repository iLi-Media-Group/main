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
    const { email, first_name } = await req.json();
    const pdfBytes = await generateWelcomePDF(first_name);
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
        <div class="title">Welcome to MyBeatFi.io, ${first_name || 'there'}!</div>
      </div>
      <div class="body-text">
        Thanks for signing up. You're now part of a global community of creatives ready to license, sync, and discover incredible music.
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
        to: email,
        subject: `🎉 Welcome to MyBeatFi, ${first_name || 'there'}!`,
        html,
        attachments: [
          {
            filename: "Welcome-Guide.pdf",
            content: pdfBase64,
            type: "application/pdf",
          },
        ],
        tags: [{ name: "signup", value: "new_user" }]
      }),
    });

    if (!response.ok) {
      console.error("Email send failed:", await response.text());
      return new Response("Failed to send welcome email", { status: 500 });
    }

    return new Response("Welcome email sent!", { status: 200 });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response("Error sending email", { status: 500 });
  }
}); 