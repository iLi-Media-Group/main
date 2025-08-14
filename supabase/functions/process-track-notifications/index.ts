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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get unprocessed notification queue items
    const { data: queueItems, error: queueError } = await supabase
      .from('track_notification_queue')
      .select('id, track_id, producer_id')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(10);

    if (queueError) {
      console.error('Error fetching notification queue:', queueError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notification queue' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No notifications to process' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    let errorCount = 0;

    // Process each queue item
    for (const item of queueItems) {
      try {
        // Get track details
        const { data: trackData, error: trackError } = await supabase
          .from('tracks')
          .select(`
            id,
            title,
            description,
            genre,
            sub_genre,
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
          .eq('id', item.track_id)
          .single();

        if (trackError || !trackData) {
          console.error('Error fetching track:', trackError);
          errorCount++;
          continue;
        }

        // Get followers who have email notifications enabled
        const { data: followers, error: followersError } = await supabase
          .rpc('get_producer_followers', { p_producer_id: item.producer_id, p_limit: 1000 });

        if (followersError) {
          console.error('Error fetching followers:', followersError);
          errorCount++;
          continue;
        }

        // Filter followers who have email notifications enabled
        const followersWithEmailNotifications = followers.filter(f => f.email_notifications_enabled);

        if (followersWithEmailNotifications.length === 0) {
          // Mark as processed even if no followers
          await supabase
            .from('track_notification_queue')
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq('id', item.id);
          processedCount++;
          continue;
        }

        const producerName = `${trackData.producer.first_name || ''} ${trackData.producer.last_name || ''}`.trim() || 'Producer';
        const companyName = trackData.producer.company_name || '';
        const displayName = companyName || producerName;

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
        <img class="logo" src="https://mybeatfi.io/logo.png" alt="MyBeatFi Logo" />
        <div class="title">New Track Alert! 🎵</div>
        <div class="subtitle">A producer you follow just uploaded a new track</div>
      </div>
      
      <div class="track-card">
        <div class="track-title">"${trackData.title}"</div>
        ${trackData.description ? `<p style="color: #d1d5db; margin: 10px 0; line-height: 1.5;">${trackData.description}</p>` : ''}
        
        <div class="track-details">
          <div class="detail-item">
            <span class="detail-label">Genre:</span>
            <span class="detail-value">${trackData.genre || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Sub-Genre:</span>
            <span class="detail-value">${trackData.sub_genre || 'N/A'}</span>
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
            <span class="detail-value">${trackData.duration ? `${Math.floor(trackData.duration / 60)}:${(trackData.duration % 60).toString().padStart(2, '0')}` : 'N/A'}</span>
          </div>
        </div>
      </div>
      
      <div class="producer-info">
        <div class="producer-name">${displayName}</div>
        <div style="color: #9ca3af; font-size: 14px;">Producer</div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://mybeatfi.io/track/${trackData.id}" class="button">Listen & License Now</a>
      </div>
      
      <div class="footer">
        This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
        2025 © All rights reserved.
        <div class="unsubscribe">
          You're receiving this because you follow ${displayName} and have email notifications enabled.<br />
          <a href="https://mybeatfi.io/following">Manage your following preferences</a>
        </div>
      </div>
    </div>
  </body>
</html>`;

        // Send emails to all followers with notifications enabled
        const emailPromises = followersWithEmailNotifications.map(async (follower) => {
          try {
            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "MyBeatFi <notifications@mybeatfi.com>",
                to: follower.follower_email,
                subject: subjectLine,
                html,
                tags: [
                  { name: "notification_type", value: "producer_track" },
                  { name: "producer_id", value: item.producer_id },
                  { name: "track_id", value: item.track_id }
                ]
              }),
            });

            if (!response.ok) {
              console.error(`Failed to send email to ${follower.follower_email}:`, await response.text());
              return { success: false, email: follower.follower_email, error: 'Email send failed' };
            }

            // Log the email
            await supabase
              .from('email_logs')
              .insert({
                to_email: follower.follower_email,
                subject: subjectLine,
                status: 'sent'
              });

            return { success: true, email: follower.follower_email };
          } catch (error) {
            console.error(`Error sending email to ${follower.follower_email}:`, error);
            return { success: false, email: follower.follower_email, error: error.message };
          }
        });

        const results = await Promise.all(emailPromises);
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`Sent ${successful.length} emails successfully, ${failed.length} failed for track ${item.track_id}`);

        // Mark as processed
        await supabase
          .from('track_notification_queue')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', item.id);

        processedCount++;

      } catch (error) {
        console.error('Error processing queue item:', error);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${processedCount} notifications successfully`,
        processed: processedCount,
        errors: errorCount,
        total: queueItems.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
