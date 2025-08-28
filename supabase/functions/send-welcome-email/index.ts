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
    `Thank you for joining MyBeatFi.io!\n\nThis guide will help you get started with our comprehensive music licensing platform.`,
    { x: 50, y: 700, size: 14, font, color: rgb(0, 0, 0) }
  );

  // Add comprehensive feature summary
  const features = [
    "CORE MUSIC LICENSING PLATFORM",
    "• Browse Music Catalog - Access to a comprehensive library of tracks from producers worldwide",
    "• Instant Licensing - Quick and easy music licensing for projects",
    "• Multiple Account Types - Support for clients, artists, record labels, and producers",
    "",
    "TARGET USE CASES",
    "• Content Creators - YouTube, social media, streaming content",
    "• Advertisers - Commercial campaigns and brand content",
    "• Film & TV - Background music and soundtracks",
    "• Podcasters - Intro/outro music and background tracks",
    "• Game Developers - In-game music and sound effects",
    "• Event Planners - Event and presentation music",
    "",
    "ADVANCED SEARCH & DISCOVERY",
    "• Genre Filtering - Filter tracks by musical genres",
    "• Mood Filtering - Find tracks by emotional tone and atmosphere",
    "• Artist Search - Search by track title or artist name",
    "• Pagination - Browse through large catalogs efficiently",
    "",
    "PLAYLIST MANAGEMENT",
    "• Create Playlists - Build custom playlists for projects and inspiration",
    "• Add Tracks - Add any track from the catalog to playlists",
    "• Share Playlists - Share playlists with music supervisors, agencies, and others",
    "• Catalog Browser - Full catalog access with search and filtering",
    "• Track Organization - Organize favorite tracks for easy access",
    "",
    "USER DASHBOARD",
    "• Personalized Dashboard - Custom interface for client needs",
    "• Profile Management - Edit account information and preferences",
    "• Quick Access - Easy navigation to key features",
    "• License Usage Tracking - Monitor your licensing activity",
    "• Cost Management - Track spending and usage patterns",
    "",
    "ROBUST LICENSING SYSTEM",
    "• On-demand licenses - Choose a track to license and complete the process now",
    "• Sync Proposals - Submit your project and pitch to a creator for pre-made tracks",
    "• Custom Sync Requests - Request a custom track for your media production",
    "",
    "PROJECT MANAGEMENT",
    "• Track Favorites - Save tracks for later consideration",
    "• Project Organization - Group tracks by project or campaign",
    "• Playlisting - Create and Share playlists with others",
    "",
    "SECURITY & PRIVACY",
    "• Secure Authentication - Protected user accounts",
    "• Data Privacy - User information protection",
    "• Professional Branding - Trusted platform for music licensing",
    "",
    "SUPPORT & RESOURCES",
    "• Educational Content - Weekly emails with platform tips",
    "• Announcements Page - YouTube videos and Web-based stories for sync",
    "• Professional Support - Backed by iLi Media Group, LLC",
    "",
    "USER EXPERIENCE",
    "• Modern UI - Clean, professional interface",
    "• Mobile Responsive - Access from any device",
    "• Fast Performance - Optimized for quick browsing and licensing",
    "• Intuitive Navigation - Easy-to-use platform design",
    "",
    "SUMMARY",
    "MyBeatFi provides a comprehensive, user-friendly platform for clients to discover, license,",
    "and manage music for their creative projects with professional support.",
    "",
    "Visit your dashboard to begin your journey!"
  ];

  let yPosition = 650;
  features.forEach((feature, index) => {
    if (feature === "CORE MUSIC LICENSING PLATFORM" || feature === "TARGET USE CASES" || 
        feature === "ADVANCED SEARCH & DISCOVERY" || feature === "PLAYLIST MANAGEMENT" || 
        feature === "USER DASHBOARD" || feature === "ROBUST LICENSING SYSTEM" || 
        feature === "PROJECT MANAGEMENT" || feature === "SECURITY & PRIVACY" || 
        feature === "SUPPORT & RESOURCES" || feature === "USER EXPERIENCE" || 
        feature === "SUMMARY") {
      // Section headers - bold and larger
      page.drawText(feature, { x: 50, y: yPosition, size: 12, font, color: rgb(0, 0.88, 1) });
      yPosition -= 20;
    } else if (feature.startsWith("•")) {
      // Feature items - normal size
      page.drawText(feature, { x: 50, y: yPosition, size: 10, font, color: rgb(0, 0, 0) });
      yPosition -= 15;
    } else if (feature === "") {
      // Empty lines for spacing
      yPosition -= 10;
    } else {
      // Regular text
      page.drawText(feature, { x: 50, y: yPosition, size: 10, font, color: rgb(0, 0, 0) });
      yPosition -= 15;
    }
  });

  // ...add more content as needed...

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
        
        const pdfBytes = await generateWelcomePDF('Test User');
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
    
    const pdfBytes = await generateWelcomePDF(first_name);
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