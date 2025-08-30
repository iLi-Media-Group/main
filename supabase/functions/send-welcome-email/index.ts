import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib";

async function generateWelcomePDF(firstName: string, accountType: string) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const date = new Date().toLocaleDateString();

  // === 1. Cover Page ===
  const cover = pdfDoc.addPage([595, 842]); // A4
  const { height, width } = cover.getSize();

  // Load logo
  const logoUrl =
    "https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1753301925481";
  const logoBytes = await fetch(logoUrl).then((res) => res.arrayBuffer());
  const logoImage = await pdfDoc.embedPng(logoBytes);
  const logoDims = logoImage.scale(0.5);

  // Draw logo centered
  cover.drawImage(logoImage, {
    x: width / 2 - logoDims.width / 2,
    y: height / 2 + 100,
    width: logoDims.width,
    height: logoDims.height,
  });

  // Subtitle based on account type
  let subtitle = "Your Complete Guide to Music Licensing";
  if (accountType === "producer" || accountType === "artist_band") {
    subtitle = "Your Guide to Uploading, Managing, and Licensing Music";
  } else if (accountType === "rights_holder") {
    subtitle = "Your Guide to Catalog & Roster Management";
  }

  // Draw titles
  cover.drawText("Welcome to MyBeatFi.io", {
    x: width / 2 - 150,
    y: height / 2 - 20,
    size: 24,
    font,
    color: rgb(0, 0.88, 1),
  });
  cover.drawText(subtitle, {
    x: width / 2 - 180,
    y: height / 2 - 50,
    size: 14,
    font,
    color: rgb(0, 0, 0),
  });
  cover.drawText(`Generated for ${firstName || "New User"} on ${date}`, {
    x: width / 2 - 120,
    y: 80,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // === 2. Main Content ===
  let page = pdfDoc.addPage([595, 842]);
  let y = 780;
  let pages: typeof page[] = [page]; // track pages for page numbers

  function addText(
    text: string,
    options: { size?: number; color?: [number, number, number]; header?: boolean } = {},
  ) {
    const { size = 10, color = [0, 0, 0], header = false } = options;

    if (y < 80) {
      page = pdfDoc.addPage([595, 842]);
      pages.push(page);
      y = 780;
    }

    page.drawText(text, {
      x: header ? 50 : 65,
      y,
      size,
      font,
      color: rgb(color[0], color[1], color[2]),
    });

    y -= header ? 20 : 15;
  }

  // === 3. Guide Content ===
  let guideContent: string[] = [];

  if (accountType === "client") {
    guideContent = [
      "Welcome to MyBeatFi!",
      "Thank you for joining the MyBeatFi community. We built MyBeatFi to make music licensing simple, legal, and inspiring for filmmakers, advertisers, podcasters, and creators.",
      "Quick Start Checklist",
      "1. Browse the catalog and explore music by genre or mood.",
      "2. Favorite tracks you love for easy access later.",
      "3. Build a playlist to organize tracks for a project.",
      "4. License a track instantly or submit a Sync Proposal.",
      "5. Use your dashboard to track activity and spending.",
      "Licensing Options",
      "• Instant Licensing – License a track in just a few clicks. Perfect for quick projects like YouTube videos or podcasts.",
      "• Sync Proposals – Some tracks are 'Sync Only.' Submit your project, chat with the producer, negotiate, and license securely.",
      "• Custom Sync Requests – Need something unique? Post a request and get custom tracks from producers worldwide.",
      "Discovering Music",
      "• Advanced Search – Filter by genre, mood, or keywords.",
      "• Favorites – Save tracks by clicking the heart icon.",
      "• Playlists – Group tracks into collections, share with supervisors, or use for inspiration.",
      "Dashboard",
      "• View your licensed tracks and history.",
      "• Track spending and usage.",
      "• Manage your profile and preferences.",
      "• Access open proposals and requests.",
      "Resources & Support",
      "• Learning Hub – Videos and guides to master sync.",
      "• Weekly Tips – Emails with best practices.",
      "• Support Team – Professional help when you need it.",
      "Security & Trust",
      "• Secure accounts and encrypted licensing records.",
      "• Transparent agreements with firm records.",
      "• Backed by iLi Media Group, LLC.",
      "Next Steps",
      "• Browse the catalog and favorite 3 tracks.",
      "• Create your first playlist.",
      "• Try licensing a track today.",
      "Summary",
      "MyBeatFi is your hub to discover, license, and manage music for your creative projects."
    ];
  } else if (accountType === "producer" || accountType === "artist_band") {
    guideContent = [
      "Welcome to MyBeatFi Producer Network",
      "You're now part of a global community of music creators. MyBeatFi helps you upload, protect, and license your music worldwide.",
      "Quick Start Checklist",
      "1. Upload your first track (General Library or Sync-Only).",
      "2. Complete your profile with a photo and bio.",
      "3. Explore your dashboard.",
      "4. Create a playlist to showcase your work.",
      "5. Submit to a Custom Sync Request.",
      "Uploading Tracks",
      "• General Library – instantly licensed by clients.",
      "• Sync-Only – clients submit proposals, you negotiate, then finalize the deal.",
      "Example: A TV producer finds your sync-only track, sends you a proposal, and you finalize the license inside MyBeatFi.",
      "Custom Sync Requests",
      "Clients post briefs for original tracks. Submit your music, chat with clients, deliver files, and get paid.",
      "Example: A gaming studio requests 'futuristic beats.' You submit, they select you, and you land the placement.",
      "Playlists",
      "• Showcase your best tracks by mood or genre.",
      "• Share curated sets with agencies and supervisors.",
      "• Keep your catalog organized for pitching.",
      "Dashboard",
      "• Upload new tracks and edit metadata.",
      "• Update your profile.",
      "• Track sales and licenses.",
      "• Manage Sync Proposals and Requests.",
      "Resources",
      "• Sync courses and YouTube guides.",
      "• Downloadable templates and documents.",
      "• Weekly platform tips.",
      "Sync Proposals",
      "• Review incoming offers.",
      "• Negotiate rates and terms.",
      "• Accept deals and issue licenses securely.",
      "• Permanent records ensure clarity.",
      "Security & Payments",
      "• Encrypted licensing agreements.",
      "• Transparent payouts inside your dashboard.",
      "• Backed by iLi Media Group, LLC.",
      "Next Steps",
      "• Upload at least 3 tracks.",
      "• Create your first playlist.",
      "• Submit to a live sync request.",
      "Summary",
      "As a producer or artist, MyBeatFi empowers you to control licensing, connect with clients, and grow your sync career."
    ];
  } else if (accountType === "rights_holder") {
    guideContent = [
      "Welcome to MyBeatFi Rights Holder Network",
      "As a label, publisher, or catalog manager, MyBeatFi helps you manage catalogs, oversee your artist roster, and track revenues with full transparency.",
      "Quick Start Checklist",
      "1. Upload your catalog with metadata and ownership details.",
      "2. Add roster artists and assign tracks.",
      "3. Set licensing preferences (instant, sync-only, custom).",
      "4. Track artist revenues and catalog performance.",
      "5. Generate reports for accounting and audits.",
      "Catalog & Roster Management",
      "• Upload tracks with genre, mood, and ownership metadata.",
      "• Manage roster artists, linking tracks to the correct creators.",
      "• Attribute revenues by track, artist, or catalog.",
      "Example: A label uploads 200 tracks, assigns them to 10 rostered artists, and monitors which artist generates the most placements.",
      "Licensing Options",
      "• Instant Licensing – allow clients to license quickly.",
      "• Sync Proposals – require approval for high-value tracks.",
      "• Custom Sync Requests – submit catalog tracks to client briefs.",
      "Example: A publisher designates a single as sync-only. A film producer submits a proposal and negotiates terms before licensing.",
      "Dashboard & Reporting",
      "• Track active and expired licenses.",
      "• Monitor earnings per track, artist, or catalog.",
      "• View roster performance metrics.",
      "• Export CSV/PDF reports for royalty splits.",
      "Rights & Legal Protection",
      "• Transparent agreements with firm records.",
      "• Encrypted contracts and payouts.",
      "• Correct attribution of royalties across rostered artists.",
      "Resources & Support",
      "• Contract templates and licensing FAQs.",
      "• Video tutorials for bulk catalog uploads.",
      "• Dedicated support for labels and publishers.",
      "Next Steps",
      "• Upload your first catalog batch (10+ tracks).",
      "• Add a roster artist and assign tracks.",
      "• Generate your first revenue report.",
      "Summary",
      "MyBeatFi empowers rights holders to manage catalogs, oversee rosters, and maximize sync revenues with complete transparency."
    ];
  }

  // === 4. Draw Guide Content ===
  guideContent.forEach((line) => {
    if (
      line === "Welcome to MyBeatFi!" ||
      line === "Welcome to MyBeatFi Producer Network" ||
      line === "Welcome to MyBeatFi Rights Holder Network" ||
      line === "Quick Start Checklist" ||
      line === "Licensing Options" ||
      line === "Discovering Music" ||
      line === "Dashboard" ||
      line === "Resources & Support" ||
      line === "Security & Trust" ||
      line === "Next Steps" ||
      line === "Summary" ||
      line === "Uploading Tracks" ||
      line === "Custom Sync Requests" ||
      line === "Playlists" ||
      line === "Resources" ||
      line === "Sync Proposals" ||
      line === "Security & Payments" ||
      line === "Catalog & Roster Management" ||
      line === "Dashboard & Reporting" ||
      line === "Rights & Legal Protection"
    ) {
      addText(line, { size: 12, color: [0, 0.88, 1], header: true });
    } else {
      addText(line);
    }
  });

  // === 5. Add Page Numbers (skip cover) ===
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    p.drawText(`Page ${idx + 1} of ${totalPages}`, {
      x: width - 100,
      y: 30,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  return await pdfDoc.save();
}

serve(async (req) => {
  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Handle test requests
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const testEmail = url.searchParams.get('test_email');
      
      if (testEmail) {
        console.log('Test welcome email request for:', testEmail);
        
        const pdfBytes = await generateWelcomePDF('Test User', 'client');
        const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

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
            from: "MyBeatFi <welcome@mybeatfi.io>",
            to: testEmail,
            subject: "Test Welcome Email - MyBeatFi",
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
          return new Response(`Test email failed: ${errorText}`, { 
            status: 500,
            headers: corsHeaders
          });
        }

        const result = await response.json();
        console.log('Test email sent successfully:', result);
        return new Response("Test welcome email sent!", { 
          status: 200,
          headers: corsHeaders
        });
      }
      
      return new Response("Test email parameter required", { 
        status: 400,
        headers: corsHeaders
      });
    }

    const { email, first_name, account_type = 'client' } = await req.json();
    
    console.log('Welcome email request received:', { email, first_name, account_type });
    
    if (!email) {
      console.error('Email is required');
      return new Response("Email is required", { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    const pdfBytes = await generateWelcomePDF(first_name, account_type);
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

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
        Your custom welcome guide is attached as a PDF. We recommend reading it to understand how to get started.
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
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(`Error sending email: ${err.message}`, { 
      status: 500,
      headers: corsHeaders
    });
  }
}); 