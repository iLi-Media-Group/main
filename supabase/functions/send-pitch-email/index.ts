import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { to, subject, body, playlist_id, tracks } = await req.json()

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create HTML version of the email
    const htmlBody = createHtmlEmail(body, tracks)

    // Send email using Resend (or your preferred email service)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MyBeatFi Pitch Service <pitch@mybeatfi.io>',
        to: [to],
        subject: subject,
        text: body,
        html: htmlBody,
        tags: [
          { name: 'service', value: 'pitch' },
          { name: 'playlist_id', value: playlist_id }
        ]
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Email service error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const emailResult = await emailResponse.json()
    console.log('Email sent successfully:', emailResult.id)

    // Log the email sending activity
    await supabaseClient
      .from('pitch_analytics')
      .insert({
        user_id: null, // Admin action
        opportunity_id: null,
        track_id: null,
        metric_type: 'email_sent',
        metric_value: 1,
        metric_details: {
          playlist_id,
          recipient: to,
          subject,
          email_id: emailResult.id,
          tracks_count: tracks?.length || 0
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailResult.id,
        message: 'Email sent successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-pitch-email function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function createHtmlEmail(textBody: string, tracks: any[] = []) {
  // Convert text body to HTML with proper formatting
  let htmlBody = textBody
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Add track list as HTML table if tracks are provided
  if (tracks && tracks.length > 0) {
    const trackTable = `
      <br><br>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">#</th>
            <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Track Title</th>
            <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Producer</th>
            <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Listen</th>
          </tr>
        </thead>
        <tbody>
          ${tracks.map((track, index) => `
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 12px;">${index + 1}</td>
              <td style="border: 1px solid #dee2e6; padding: 12px; font-weight: bold;">${track.title}</td>
              <td style="border: 1px solid #dee2e6; padding: 12px;">${track.producer_name}</td>
              <td style="border: 1px solid #dee2e6; padding: 12px;">
                ${track.track_url ? `<a href="${track.track_url}" style="color: #007bff; text-decoration: none;">▶ Play</a>` : 'N/A'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    
    htmlBody += trackTable
  }

  // Wrap in proper HTML structure
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MyBeatFi Pitch Submission</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background: white;
          padding: 20px;
          border: 1px solid #e1e5e9;
          border-top: none;
        }
        .footer {
          background: #f8f9fa;
          padding: 15px 20px;
          border-radius: 0 0 8px 8px;
          border: 1px solid #e1e5e9;
          border-top: none;
          font-size: 12px;
          color: #6c757d;
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #dee2e6;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        a {
          color: #007bff;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎵 MyBeatFi Pitch Service</h1>
        <p>Professional Music Licensing & Sync Placements</p>
      </div>
      <div class="content">
        ${htmlBody}
      </div>
      <div class="footer">
        <p>This email was sent via MyBeatFi Pitch Service</p>
        <p>For support, contact: <a href="mailto:support@mybeatfi.io">support@mybeatfi.io</a></p>
      </div>
    </body>
    </html>
  `
}
