import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { track_id, producer_id } = await req.json();

    if (!track_id || !producer_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: track_id and producer_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get track details
    const { data: trackData, error: trackError } = await supabase
      .from('tracks')
      .select(`
        id,
        title,
        genres,
        sub_genres,
        bpm,
        key,
        duration,
        track_producer_id,
        producer:profiles!track_producer_id (
          id,
          first_name,
          last_name,
          email,
          company_name
        )
      `)
      .eq('id', track_id)
      .single();

    if (trackError || !trackData) {
      console.error('Error fetching track:', trackError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch track details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get followers who have email notifications enabled
    const { data: followers, error: followersError } = await supabase
      .rpc('get_producer_followers', { p_producer_id: producer_id, p_limit: 1000 });

    if (followersError) {
      console.error('Error fetching followers:', followersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch followers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter followers who have email notifications enabled
    const followersWithEmailNotifications = followers.filter(f => f.email_notifications_enabled);

    if (followersWithEmailNotifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No followers with email notifications enabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const producerName = `${trackData.producer.first_name || ''} ${trackData.producer.last_name || ''}`.trim() || 'Producer';
    const companyName = trackData.producer.company_name || '';
    const displayName = companyName || producerName;
    
    // Debug logging
    console.log('Producer data:', {
      first_name: trackData.producer.first_name,
      last_name: trackData.producer.last_name,
      company_name: trackData.producer.company_name,
      producerName,
      companyName,
      displayName
    });

    // Generate catchy subject line
    const subjectLines = [
      `🎵 New Beat Alert: "${trackData.title}" by ${displayName}`,
      `🔥 Fresh Track: ${displayName} just dropped "${trackData.title}"`,
      `⚡ New Release: "${trackData.title}" - Ready for licensing!`,
      `🎶 Latest from ${displayName}: "${trackData.title}" now available`,
      `💎 New Gem: "${trackData.title}" by ${displayName} - Check it out!`
    ];
    const subjectLine = subjectLines[Math.floor(Math.random() * subjectLines.length)];

    // Create email HTML
    const html = `<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #111827;
        color: #f9fafb;
        padding: 40px;
        margin: 0;
      }
      .container {
        max-width: 600px;
        margin: auto;
        background: #1f2937;
        border-radius: 12px;
        padding: 30px;
        border: 1px solid #374151;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      .logo {
        max-width: 150px;
        margin-bottom: 15px;
      }
      .title {
        font-size: 24px;
        font-weight: bold;
        color: #3b82f6;
        margin-bottom: 10px;
      }
      .subtitle {
        font-size: 16px;
        color: #9ca3af;
        margin-bottom: 25px;
      }
      .track-card {
        background: linear-gradient(135deg, #3b82f6/10, #8b5cf6/10);
        border: 1px solid #3b82f6/20;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
      }
      .track-title {
        font-size: 20px;
        font-weight: bold;
        color: #f9fafb;
        margin-bottom: 10px;
      }
      .track-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin: 15px 0;
      }
      .detail-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #374151;
      }
      .detail-label {
        color: #9ca3af;
        font-size: 14px;
      }
      .detail-value {
        color: #f9fafb;
        font-weight: 500;
        font-size: 14px;
      }
      .producer-info {
        background: #374151;
        border-radius: 6px;
        padding: 15px;
        margin: 20px 0;
        text-align: center;
      }
      .producer-name {
        font-size: 18px;
        font-weight: bold;
        color: #3b82f6;
        margin-bottom: 5px;
      }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        text-decoration: none;
        padding: 15px 30px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 16px;
        margin: 20px 0;
        transition: all 0.3s ease;
      }
      .button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #9ca3af;
        text-align: center;
        border-top: 1px solid #374151;
        padding-top: 20px;
      }
      .unsubscribe {
        font-size: 11px;
        color: #6b7280;
        margin-top: 15px;
      }
      .unsubscribe a {
        color: #6b7280;
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="container">
             <div class="header">
         <img class="logo" src="https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/public/logo.png" alt="MyBeatFi Logo" />
         <div class="title">New Track Alert! 🎵</div>
         <div class="subtitle">A producer you follow just uploaded a new track</div>
       </div>
      
             <div class="track-card">
         <div class="track-title">"${trackData.title}"</div>
        
                 <div class="track-details">
                       <div class="detail-item">
              <span class="detail-label">Genre:</span>
              <span class="detail-value">${trackData.genres && trackData.genres !== '{}' ? trackData.genres : 'N/A'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Sub-Genre:</span>
              <span class="detail-value">${trackData.sub_genres && trackData.sub_genres !== '{}' ? trackData.sub_genres : 'N/A'}</span>
            </div>
          <div class="detail-item">
            <span class="detail-label">BPM:</span>
            <span class="detail-value">${trackData.bpm || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Key:</span>
            <span class="detail-value">${trackData.key || 'N/A'}</span>
          </div>
                     <div class="detail-item">
             <span class="detail-label">Duration:</span>
             <span class="detail-value">${trackData.duration ? trackData.duration : 'N/A'}</span>
           </div>
        </div>
      </div>
      
             <div class="producer-info">
         <div class="producer-name">${displayName}</div>
         <div style="color: #9ca3af; font-size: 14px;">${displayName}</div>
       </div>
      
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/track/${trackData.id}" class="button">Listen & License Now</a>
      </div>
      
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
        <div class="unsubscribe">
          You're receiving this because you follow ${displayName} and have email notifications enabled.<br />
          <a href="https://mybeatfi.io/dashboard/following">Manage your following preferences</a>
        </div>
      </div>
    </div>
  </body>
</html>`;

    // Send emails to all followers with notifications enabled using BCC for privacy
    // We'll send one email to a dummy address and BCC all followers
    const followerEmails = followersWithEmailNotifications.map(f => f.follower_email);
    
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
                 body: JSON.stringify({
           from: "MyBeatFi <notifications@mybeatfi.io>",
           to: "noreply@mybeatfi.io", // Dummy recipient
           bcc: followerEmails, // BCC all followers for privacy
          subject: subjectLine,
          html,
          tags: [
            { name: "notification_type", value: "producer_track" },
            { name: "producer_id", value: producer_id },
            { name: "track_id", value: track_id }
          ]
        }),
      });

        if (!response.ok) {
          console.error(`Failed to send email to followers:`, await response.text());
          return new Response(
            JSON.stringify({ error: 'Failed to send emails to followers' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log the email
        await supabase
          .from('email_logs')
          .insert({
            to_email: 'multiple_recipients_bcc',
            subject: subjectLine,
            status: 'sent',
            recipient_count: followerEmails.length
          });

        console.log(`Sent email to ${followerEmails.length} followers using BCC`);

        return new Response(
          JSON.stringify({
            message: `Sent email to ${followerEmails.length} followers successfully using BCC`,
            recipient_count: followerEmails.length,
            privacy: 'BCC used to protect email addresses'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error(`Error sending email to followers:`, error);
        return new Response(
          JSON.stringify({ error: 'Failed to send emails to followers' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
