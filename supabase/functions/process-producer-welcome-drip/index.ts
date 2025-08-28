import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get due producer drip emails
    const now = new Date();
    const { data: subscriptions, error } = await supabase
      .from('producer_welcome_drip_subscriptions')
      .select('*')
      .eq('completed', false)
      .lte('next_send_at', now.toISOString());

    if (error) {
      console.error('Error fetching producer drip subscriptions:', error);
      return new Response(`Error fetching subscriptions: ${error.message}`, { 
        status: 500,
        headers: corsHeaders
      });
    }

    console.log(`Found ${subscriptions?.length || 0} due producer drip emails`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response("No due producer drip emails", { 
        status: 200,
        headers: corsHeaders
      });
    }

    // Process each subscription
    for (const subscription of subscriptions) {
      const week = subscription.current_week + 1;
      
      if (week > 6) {
        // Mark as completed
        await supabase
          .from('producer_welcome_drip_subscriptions')
          .update({ completed: true })
          .eq('id', subscription.id);
        continue;
      }

      // Get email content for this week
      const emailContent = getProducerEmailContent(week, subscription.first_name, subscription.account_type);
      
      // Send email
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MyBeatFi <welcome@mybeatfi.io>",
          to: subscription.email,
          subject: emailContent.subject,
          html: emailContent.html,
          tags: [
            { name: "drip_campaign", value: "producer_welcome" },
            { name: "week", value: week.toString() },
            { name: "account_type", value: subscription.account_type }
          ]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to send producer drip email week ${week} to ${subscription.email}:`, errorText);
        continue;
      }

      console.log(`Sent producer drip email week ${week} to ${subscription.email}`);

      // Calculate next send time (next Monday at 7pm)
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + (8 - now.getDay()) % 7); // Next Monday
      nextMonday.setHours(19, 0, 0, 0); // 7pm

      // Update subscription
      await supabase
        .from('producer_welcome_drip_subscriptions')
        .update({ 
          current_week: week,
          next_send_at: nextMonday.toISOString(),
          completed: week >= 6
        })
        .eq('id', subscription.id);
    }

    return new Response(`Processed ${subscriptions.length} producer drip emails`, { 
      status: 200,
      headers: corsHeaders
    });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(`Error processing producer drip: ${err.message}`, { 
      status: 500,
      headers: corsHeaders
    });
  }
});

function getProducerEmailContent(week: number, firstName: string, accountType: string) {
  const name = firstName || 'there';
  const accountTypeText = accountType === 'producer' ? 'Producer' : 
                         accountType === 'artist_band' ? 'Artist' : 'Rights Holder';

  const emails = {
    1: {
      subject: "🚀 Start uploading your tracks to MyBeatFi",
      html: `<!DOCTYPE html>
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
        <div class="title">Hi ${name},</div>
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
    2: {
      subject: "✨ Get your music placed with custom projects",
      html: `<!DOCTYPE html>
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
        <div class="title">Hi ${name},</div>
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
        👉 Every request is an opportunity to build direct relationships with clients and land custom placements.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/dashboard" class="button">View Current Sync Requests</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
    },
    3: {
      subject: "🎧 Showcase your music with playlists",
      html: `<!DOCTYPE html>
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
        <div class="title">Hi ${name},</div>
      </div>
      <div class="body-text">
        Music supervisors and agencies love curated collections. With MyBeatFi Playlists, you can:
        <br /><br />
        • Group your tracks by genre, mood, or project type<br />
        • Share an organized body of work with supervisors and clients<br />
        • Stand out by presenting your music in a professional, easy-to-browse format
        <br /><br />
        👉 Think of playlists as your portfolio—tailored to the people who need to hear it most.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/dashboard" class="button">Create Your First Playlist</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
    },
    4: {
      subject: "📊 Manage your entire music career in one place",
      html: `<!DOCTYPE html>
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
        <div class="title">Hi ${name},</div>
      </div>
      <div class="body-text">
        Your Dashboard is the hub of your MyBeatFi account. From here you can:
        <br /><br />
        • Upload new tracks and edit existing ones<br />
        • Update your profile picture, bio, and display name<br />
        • Track your sales and active licenses<br />
        • See open Sync Proposals and Custom Requests<br />
        • Submit to briefs directly from your dashboard
        <br /><br />
        👉 Everything you need to stay on top of your sync journey, all in one place.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/dashboard" class="button">Explore Your Dashboard</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
    },
    5: {
      subject: "📚 Tools to grow your sync career",
      html: `<!DOCTYPE html>
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
        <div class="title">Hi ${name},</div>
      </div>
      <div class="body-text">
        Sync success isn't just about uploading tracks—it's about learning the business. That's why we've created a Resources section with:
        <br /><br />
        • Training videos on YouTube<br />
        • Sync licensing courses<br />
        • Downloadable documents and guides<br />
        • Insider tips to help you land more placements
        <br /><br />
        👉 Invest in your knowledge today, and watch your opportunities grow.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/dashboard" class="button">Check Out Resources</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
    },
    6: {
      subject: "💬 Negotiate deals directly with clients",
      html: `<!DOCTYPE html>
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
        <div class="title">Hi ${name},</div>
      </div>
      <div class="body-text">
        When you upload tracks as Sync-Only, they'll appear in your Sync Proposals section. Here's what you can do:
        <br /><br />
        • Review incoming client proposals<br />
        • Chat and negotiate rate and payment terms<br />
        • Accept the final deal and issue a license<br />
        • Keep firm records of what was agreed—so everything is clear and protected
        <br /><br />
        👉 It's your music, your terms—handled securely through MyBeatFi.
      </div>
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/dashboard" class="button">Manage Your Sync Proposals</a>
      </div>
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
      </div>
    </div>
  </body>
</html>`
    }
  };

  return emails[week as keyof typeof emails] || emails[1];
}
