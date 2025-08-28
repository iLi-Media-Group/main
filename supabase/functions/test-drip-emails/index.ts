import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

// Client drip email templates with full HTML styling
const clientTemplates = [
  {
    week: 1,
    subject: 'Need music for your project? Start licensing instantly.',
    html: (firstName: string) => `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #ffffff; color: #333333; padding: 40px; margin: 0; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { max-width: 150px; margin-bottom: 10px; }
      .title { font-size: 22px; font-weight: bold; color: #1f2937; }
      .body-text { margin: 20px 0; line-height: 1.6; color: #374151; }
      .button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
      .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img class="logo" src="https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1753301925481" alt="MyBeatFi Logo" />
        <div class="title">Hi ${firstName || 'there'},</div>
      </div>
      <div class="body-text">
        Meet Mario. He's producing an indie film and needs music that fits the mood without copyright risk.
        <br /><br />
        With MyBeatFi Track Licensing, you can license tracks legally and securely—ready for film, ads, or podcasts.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/catalog" class="button">Browse Tracks & License Now</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
  },
  {
    week: 2,
    subject: 'Connect directly with producers before you license',
    html: (firstName: string) => `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #ffffff; color: #333333; padding: 40px; margin: 0; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { max-width: 150px; margin-bottom: 10px; }
      .title { font-size: 22px; font-weight: bold; color: #1f2937; }
      .body-text { margin: 20px 0; line-height: 1.6; color: #374151; }
      .button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
      .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img class="logo" src="https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1753301925481" alt="MyBeatFi Logo" />
        <div class="title">Hi ${firstName || 'there'},</div>
      </div>
      <div class="body-text">
        Imagine Sarah, a creative director. She finds the perfect track listed as a Sync Proposal.
        <br /><br />
        That means the producer wants to be contacted first. Share details, chat, negotiate, then receive the official license.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/sync-proposals" class="button">Submit a Sync Proposal Today</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
  },
  {
    week: 3,
    subject: 'Get music custom-made for your project',
    html: (firstName: string) => `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #ffffff; color: #333333; padding: 40px; margin: 0; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { max-width: 150px; margin-bottom: 10px; }
      .title { font-size: 22px; font-weight: bold; color: #1f2937; }
      .body-text { margin: 20px 0; line-height: 1.6; color: #374151; }
      .button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
      .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img class="logo" src="https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1753301925481" alt="MyBeatFi Logo" />
        <div class="title">Hi ${firstName || 'there'},</div>
      </div>
      <div class="body-text">
        Meet David. He needs a completely original soundtrack for a fashion brand campaign.
        <br /><br />
        With Custom Sync Requests, connect with producers who create on-brand music just for you.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/custom-sync-request" class="button">Request a Custom Track Now</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
  },
  {
    week: 4,
    subject: 'Save the tracks you love (and never lose them)',
    html: (firstName: string) => `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #ffffff; color: #333333; padding: 40px; margin: 0; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { max-width: 150px; margin-bottom: 10px; }
      .title { font-size: 22px; font-weight: bold; color: #1f2937; }
      .body-text { margin: 20px 0; line-height: 1.6; color: #374151; }
      .button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
      .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img class="logo" src="https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1753301925481" alt="MyBeatFi Logo" />
        <div class="title">Hi ${firstName || 'there'},</div>
      </div>
      <div class="body-text">
        Picture Ana. She hears the perfect track late at night and wants to find it later.
        <br /><br />
        Click the heart icon to favorite tracks—ready to revisit anytime.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/catalog" class="button">Start Favoriting Tracks Today</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
  },
  {
    week: 5,
    subject: 'Stay connected to your favorite creators',
    html: (firstName: string) => `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #ffffff; color: #333333; padding: 40px; margin: 0; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { max-width: 150px; margin-bottom: 10px; }
      .title { font-size: 22px; font-weight: bold; color: #1f2937; }
      .body-text { margin: 20px 0; line-height: 1.6; color: #374151; }
      .button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
      .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img class="logo" src="https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1753301925481" alt="MyBeatFi Logo" />
        <div class="title">Hi ${firstName || 'there'},</div>
      </div>
      <div class="body-text">
        Take James. He follows producers who match his projects. When they upload, he's first to know.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/producers" class="button">Follow a Producer Now</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
  },
  {
    week: 6,
    subject: 'Curated playlists, saved for you',
    html: (firstName: string) => `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #ffffff; color: #333333; padding: 40px; margin: 0; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { max-width: 150px; margin-bottom: 10px; }
      .title { font-size: 22px; font-weight: bold; color: #1f2937; }
      .body-text { margin: 20px 0; line-height: 1.6; color: #374151; }
      .button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
      .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img class="logo" src="https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1753301925481" alt="MyBeatFi Logo" />
        <div class="title">Hi ${firstName || 'there'},</div>
      </div>
      <div class="body-text">
        Think of Carla. She favorites playlists full of cinematic tracks and returns anytime.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/favorited-playlists" class="button">Discover & Favorite Playlists Now</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
  }
];

// Producer drip email templates with full HTML styling
const producerTemplates = [
  {
    week: 1,
    subject: "Start uploading your tracks to MyBeatFi",
    html: (firstName: string, accountType: string) => `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #ffffff; color: #333333; padding: 40px; margin: 0; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { max-width: 150px; margin-bottom: 10px; }
      .title { font-size: 22px; font-weight: bold; color: #1f2937; }
      .body-text { margin: 20px 0; line-height: 1.6; color: #374151; }
      .button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
      .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img class="logo" src="https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1753301925481" alt="MyBeatFi Logo" />
        <div class="title">Hi ${firstName || 'there'},</div>
      </div>
      <div class="body-text">
        Your journey begins with uploading your music. On MyBeatFi, you have two options:
        <br /><br />
        <strong>General Library Tracks</strong> → These can be licensed instantly by any client. Quick, simple, and perfect for generating steady income.
        <br /><br />
        <strong>Sync-Only Tracks</strong> → These require clients to submit a Sync Proposal first. You'll have the chance to negotiate terms, finalize details, and issue the license.
        <br /><br />
        👉 This gives you control—choose which tracks are instantly available and which ones go through a personalized process.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/dashboard" class="button">Upload Your First Track</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
  },
  {
    week: 2,
    subject: "Get your music placed with custom projects",
    html: (firstName: string, accountType: string) => `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #ffffff; color: #333333; padding: 40px; margin: 0; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { max-width: 150px; margin-bottom: 10px; }
      .title { font-size: 22px; font-weight: bold; color: #1f2937; }
      .body-text { margin: 20px 0; line-height: 1.6; color: #374151; }
      .button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
      .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img class="logo" src="https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1753301925481" alt="MyBeatFi Logo" />
        <div class="title">Hi ${firstName || 'there'},</div>
      </div>
      <div class="body-text">
        Sometimes clients need music written specifically for their project. That's where Custom Sync Requests come in.
        <br /><br />
        When a client creates a request, you can:
        <br /><br />
        • Review the project brief<br />
        • Submit tracks that match the vision<br />
        • Chat with the client once they've chosen your track<br />
        • Deliver files, sign the agreement, and get paid
        <br /><br />
        This is your chance to create original music for specific projects and build lasting relationships with clients.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/custom-sync-requests" class="button">Browse Custom Sync Requests</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
  },
  {
    week: 3,
    subject: "Build your profile and showcase your work",
    html: (firstName: string, accountType: string) => `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #ffffff; color: #333333; padding: 40px; margin: 0; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { max-width: 150px; margin-bottom: 10px; }
      .title { font-size: 22px; font-weight: bold; color: #1f2937; }
      .body-text { margin: 20px 0; line-height: 1.6; color: #374151; }
      .button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
      .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img class="logo" src="https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1753301925481" alt="MyBeatFi Logo" />
        <div class="title">Hi ${firstName || 'there'},</div>
      </div>
      <div class="body-text">
        Your profile is your digital business card. It's how clients discover you and decide to work with you.
        <br /><br />
        Make sure your profile includes:
        <br /><br />
        • A professional photo<br />
        • A compelling bio that describes your style<br />
        • Links to your social media and website<br />
        • Examples of your best work
        <br /><br />
        A complete profile increases your chances of being selected for custom projects and sync opportunities.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/profile" class="button">Update Your Profile</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
  },
  {
    week: 4,
    subject: "Manage sync proposals and negotiate deals",
    html: (firstName: string, accountType: string) => `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #ffffff; color: #333333; padding: 40px; margin: 0; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { max-width: 150px; margin-bottom: 10px; }
      .title { font-size: 22px; font-weight: bold; color: #1f2937; }
      .body-text { margin: 20px 0; line-height: 1.6; color: #374151; }
      .button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
      .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img class="logo" src="https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1753301925481" alt="MyBeatFi Logo" />
        <div class="title">Hi ${firstName || 'there'},</div>
      </div>
      <div class="body-text">
        When clients submit sync proposals for your tracks, you have the opportunity to negotiate terms and build relationships.
        <br /><br />
        The sync proposal process:
        <br /><br />
        • Review the client's project details<br />
        • Negotiate licensing terms and pricing<br />
        • Finalize the agreement through MyBeatFi<br />
        • Issue the license and get paid
        <br /><br />
        This personalized approach often leads to higher licensing fees and repeat business.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/sync-proposals" class="button">View Sync Proposals</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
  },
  {
    week: 5,
    subject: "Track your earnings and grow your business",
    html: (firstName: string, accountType: string) => `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #ffffff; color: #333333; padding: 40px; margin: 0; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { max-width: 150px; margin-bottom: 10px; }
      .title { font-size: 22px; font-weight: bold; color: #1f2937; }
      .body-text { margin: 20px 0; line-height: 1.6; color: #374151; }
      .button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
      .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img class="logo" src="https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1753301925481" alt="MyBeatFi Logo" />
        <div class="title">Hi ${firstName || 'there'},</div>
      </div>
      <div class="body-text">
        Your dashboard is your command center for tracking earnings, managing licenses, and growing your sync business.
        <br /><br />
        Monitor your progress:
        <br /><br />
        • Track earnings from instant licenses<br />
        • Monitor sync proposal negotiations<br />
        • View custom sync request opportunities<br />
        • Analyze which tracks perform best
        <br /><br />
        Use these insights to optimize your catalog and pricing strategy.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/dashboard" class="button">View Your Dashboard</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
  },
  {
    week: 6,
    subject: "Connect with the MyBeatFi community",
    html: (firstName: string, accountType: string) => `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #ffffff; color: #333333; padding: 40px; margin: 0; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { text-align: center; margin-bottom: 20px; }
      .logo { max-width: 150px; margin-bottom: 10px; }
      .title { font-size: 22px; font-weight: bold; color: #1f2937; }
      .body-text { margin: 20px 0; line-height: 1.6; color: #374151; }
      .button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; }
      .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img class="logo" src="https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/logos/logo-1753301925481" alt="MyBeatFi Logo" />
        <div class="title">Hi ${firstName || 'there'},</div>
      </div>
      <div class="body-text">
        You're part of a global community of music creators and industry professionals.
        <br /><br />
        Stay connected:
        <br /><br />
        • Follow other producers and artists<br />
        • Share your work and get feedback<br />
        • Collaborate on projects<br />
        • Learn from industry experts
        <br /><br />
        The MyBeatFi community is here to support your growth and success in the music licensing industry.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/community" class="button">Join the Community</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // 'client' or 'producer'
    const week = parseInt(url.searchParams.get('week') || '1');
    const firstName = url.searchParams.get('firstName') || 'Test User';
    const accountType = url.searchParams.get('accountType') || 'producer';

    if (!type) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Drip Email Visual Preview Tool</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #1f2937; text-align: center; margin-bottom: 30px; }
            h2 { color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 40px; }
            .email-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
            .email-card { 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              overflow: hidden; 
              background: white;
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .email-card:hover { 
              transform: translateY(-2px); 
              box-shadow: 0 8px 25px rgba(0,0,0,0.15); 
            }
            .email-header { 
              background: #f8fafc; 
              padding: 15px; 
              border-bottom: 1px solid #e5e7eb;
            }
            .week-number { font-weight: bold; color: #3b82f6; font-size: 14px; }
            .subject { font-style: italic; color: #6b7280; font-size: 12px; margin-top: 5px; }
            .email-preview { 
              height: 200px; 
              overflow: hidden; 
              position: relative;
              background: #fafafa;
            }
            .email-preview iframe { 
              width: 100%; 
              height: 100%; 
              border: none; 
              transform: scale(0.8); 
              transform-origin: top left;
            }
            .view-button { 
              display: block; 
              width: 100%; 
              padding: 12px; 
              background: #3b82f6; 
              color: white; 
              text-decoration: none; 
              text-align: center; 
              font-weight: bold;
              transition: background 0.2s;
            }
            .view-button:hover { background: #2563eb; }
            .intro { text-align: center; color: #6b7280; margin-bottom: 30px; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📧 Drip Email Visual Preview Tool</h1>
            <p class="intro">
              See exactly how your drip emails will look to clients and producers. 
              Each card shows a preview of the actual email design.
            </p>
            
            <h2>👥 Client Drip Emails (6 weeks)</h2>
            <div class="email-grid">
              ${clientTemplates.map((t, i) => 
                `<div class="email-card">
                  <div class="email-header">
                    <div class="week-number">Week ${i+1}</div>
                    <div class="subject">${t.subject}</div>
                  </div>
                  <div class="email-preview">
                    <iframe srcdoc="${encodeURIComponent(t.html('John'))}"></iframe>
                  </div>
                  <a href="?type=client&week=${i+1}&firstName=John" class="view-button">View Full Email</a>
                </div>`
              ).join('')}
            </div>

            <h2>🎵 Producer Drip Emails (6 weeks)</h2>
            <div class="email-grid">
              ${producerTemplates.map((t, i) => 
                `<div class="email-card">
                  <div class="email-header">
                    <div class="week-number">Week ${i+1}</div>
                    <div class="subject">${t.subject}</div>
                  </div>
                  <div class="email-preview">
                    <iframe srcdoc="${encodeURIComponent(t.html('Sarah', 'producer'))}"></iframe>
                  </div>
                  <a href="?type=producer&week=${i+1}&firstName=Sarah&accountType=producer" class="view-button">View Full Email</a>
                </div>`
              ).join('')}
            </div>
          </div>
        </body>
        </html>
      `, { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    }

    let emailContent = '';
    let subject = '';

    if (type === 'client') {
      const template = clientTemplates[week - 1];
      if (template) {
        subject = template.subject;
        emailContent = template.html(firstName);
      }
    } else if (type === 'producer') {
      const template = producerTemplates[week - 1];
      if (template) {
        subject = template.subject;
        emailContent = template.html(firstName, accountType);
      }
    }

    if (!emailContent) {
      return new Response('Email template not found', { 
        status: 404,
        headers: corsHeaders
      });
    }

    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Email Preview - ${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .preview-container { max-width: 800px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .email-info { background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
            .email-info h2 { margin: 0 0 15px 0; color: #1f2937; }
            .email-info p { margin: 5px 0; color: #374151; }
            .email-preview { 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              overflow: hidden;
              background: white;
            }
            .navigation { margin-top: 30px; text-align: center; }
            .nav-button { 
              display: inline-block; 
              margin: 5px; 
              padding: 12px 20px; 
              background: #3b82f6; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px;
              font-weight: bold;
              transition: background 0.2s;
            }
            .nav-button:hover { background: #2563eb; }
            .back-button { background: #6b7280; }
            .back-button:hover { background: #4b5563; }
          </style>
        </head>
        <body>
          <div class="preview-container">
            <div class="email-info">
              <h2>📧 Email Preview</h2>
              <p><strong>Type:</strong> ${type} drip email</p>
              <p><strong>Week:</strong> ${week}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Recipient:</strong> ${firstName}</p>
              ${type === 'producer' ? `<p><strong>Account Type:</strong> ${accountType}</p>` : ''}
            </div>
            
            <div class="email-preview">
              ${emailContent}
            </div>

            <div class="navigation">
              <h3>Navigate to other emails:</h3>
              ${type === 'client' ? 
                clientTemplates.map((t, i) => 
                  `<a href="?type=client&week=${i+1}&firstName=${firstName}" class="nav-button">Week ${i+1}</a>`
                ).join('') :
                producerTemplates.map((t, i) => 
                  `<a href="?type=producer&week=${i+1}&firstName=${firstName}&accountType=${accountType}" class="nav-button">Week ${i+1}</a>`
                ).join('')
              }
              <br><br>
              <a href="?" class="nav-button back-button">← Back to Index</a>
            </div>
          </div>
        </body>
      </html>
    `, { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });

  } catch (err) {
    console.error("Error:", err);
    return new Response(`Error: ${err.message}`, { 
      status: 500,
      headers: corsHeaders
    });
  }
});
