import React, { useState } from 'react';

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

const DripEmailPreview: React.FC = () => {
  const [selectedEmail, setSelectedEmail] = useState<{
    type: 'client' | 'producer';
    week: number;
    firstName: string;
    accountType?: string;
  } | null>(null);

  const handleEmailClick = (type: 'client' | 'producer', week: number, firstName: string, accountType?: string) => {
    setSelectedEmail({ type, week, firstName, accountType });
  };

  const handleClosePreview = () => {
    setSelectedEmail(null);
  };

  const getEmailContent = () => {
    if (!selectedEmail) return '';
    
    if (selectedEmail.type === 'client') {
      const template = clientTemplates[selectedEmail.week - 1];
      return template ? template.html(selectedEmail.firstName) : '';
    } else {
      const template = producerTemplates[selectedEmail.week - 1];
      return template ? template.html(selectedEmail.firstName, selectedEmail.accountType || 'producer') : '';
    }
  };

  const getEmailSubject = () => {
    if (!selectedEmail) return '';
    
    if (selectedEmail.type === 'client') {
      const template = clientTemplates[selectedEmail.week - 1];
      return template ? template.subject : '';
    } else {
      const template = producerTemplates[selectedEmail.week - 1];
      return template ? template.subject : '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">📧 Drip Email Visual Preview</h1>
            <p className="text-lg text-gray-600">
              See exactly how your drip emails will look to clients and producers
            </p>
          </div>

          {/* Client Emails Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-blue-600 border-b-2 border-blue-600 pb-2 mb-6">
              👥 Client Drip Emails (6 weeks)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientTemplates.map((template, index) => (
                <div key={`client-${index}`} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="font-semibold text-blue-600 text-sm">Week {index + 1}</div>
                    <div className="text-gray-600 text-xs italic mt-1">{template.subject}</div>
                  </div>
                  <div className="p-4">
                    <div 
                      className="h-48 overflow-hidden bg-gray-50 rounded border"
                      dangerouslySetInnerHTML={{ 
                        __html: template.html('John').replace(/<style>.*?<\/style>/s, '') 
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleEmailClick('client', index + 1, 'John')}
                    className="w-full bg-blue-600 text-white py-3 px-4 font-semibold hover:bg-blue-700 transition-colors"
                  >
                    View Full Email
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Producer Emails Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-blue-600 border-b-2 border-blue-600 pb-2 mb-6">
              🎵 Producer Drip Emails (6 weeks)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {producerTemplates.map((template, index) => (
                <div key={`producer-${index}`} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="font-semibold text-blue-600 text-sm">Week {index + 1}</div>
                    <div className="text-gray-600 text-xs italic mt-1">{template.subject}</div>
                  </div>
                  <div className="p-4">
                    <div 
                      className="h-48 overflow-hidden bg-gray-50 rounded border"
                      dangerouslySetInnerHTML={{ 
                        __html: template.html('Sarah', 'producer').replace(/<style>.*?<\/style>/s, '') 
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleEmailClick('producer', index + 1, 'Sarah', 'producer')}
                    className="w-full bg-blue-600 text-white py-3 px-4 font-semibold hover:bg-blue-700 transition-colors"
                  >
                    View Full Email
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full Email Preview Modal */}
        {selectedEmail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Email Preview</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedEmail.type === 'client' ? 'Client' : 'Producer'} - Week {selectedEmail.week}
                    </p>
                    <p className="text-sm text-gray-600">Subject: {getEmailSubject()}</p>
                  </div>
                  <button
                    onClick={handleClosePreview}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div 
                  className="border border-gray-200 rounded-lg overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: getEmailContent() }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DripEmailPreview;
