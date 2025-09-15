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

    const { 
      type, 
      deal_id, 
      track_title, 
      producer_name, 
      deal_status, 
      deal_value, 
      deal_currency, 
      commission_amount, 
      notes 
    } = await req.json()

    if (!type || !track_title || !producer_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Find producer's email
    const { data: producer, error: producerError } = await supabaseClient
      .from('profiles')
      .select('email, display_name')
      .eq('display_name', producer_name)
      .single()

    if (producerError || !producer) {
      console.error('Error finding producer:', producerError)
      return new Response(
        JSON.stringify({ error: 'Producer not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate email content based on deal status
    const emailContent = generateDealNotificationEmail({
      type,
      track_title,
      producer_name: producer.display_name || producer_name,
      deal_status,
      deal_value,
      deal_currency,
      commission_amount,
      notes
    })

    // Send email to producer
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MyBeatFi Deal Updates <deals@mybeatfi.io>',
        to: [producer.email],
        subject: `Deal Update: ${track_title}`,
        text: emailContent.text,
        html: emailContent.html,
        tags: [
          { name: 'service', value: 'deal_notification' },
          { name: 'deal_id', value: deal_id },
          { name: 'deal_status', value: deal_status }
        ]
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Email service error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to send notification email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const emailResult = await emailResponse.json()
    console.log('Deal notification sent successfully:', emailResult.id)

    // Log the notification activity
    await supabaseClient
      .from('pitch_analytics')
      .insert({
        user_id: null, // Admin action
        opportunity_id: null,
        track_id: null,
        metric_type: 'notification_sent',
        metric_value: 1,
        metric_details: {
          deal_id,
          producer_email: producer.email,
          deal_status,
          notification_type: type,
          email_id: emailResult.id
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailResult.id,
        message: 'Deal notification sent successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-deal-notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateDealNotificationEmail({
  type,
  track_title,
  producer_name,
  deal_status,
  deal_value,
  deal_currency,
  commission_amount,
  notes
}: {
  type: string;
  track_title: string;
  producer_name: string;
  deal_status: string;
  deal_value?: number;
  deal_currency?: string;
  commission_amount?: number;
  notes?: string;
}) {
  const statusMessages = {
    'negotiating': 'We are currently negotiating the terms for your track.',
    'pending_approval': 'The deal is pending final approval from the client.',
    'approved': 'Great news! The deal has been approved by the client.',
    'closed': 'The deal has been successfully closed and finalized.',
    'cancelled': 'Unfortunately, the deal has been cancelled.'
  }

  const statusEmojis = {
    'negotiating': '🤝',
    'pending_approval': '⏳',
    'approved': '✅',
    'closed': '🎉',
    'cancelled': '❌'
  }

  const textBody = `Dear ${producer_name},

${statusEmojis[deal_status as keyof typeof statusEmojis]} Deal Update: "${track_title}"

${statusMessages[deal_status as keyof typeof statusMessages]}

${deal_value ? `Deal Value: ${deal_currency} ${deal_value.toFixed(2)}` : ''}
${commission_amount ? `Your Commission: ${deal_currency} ${commission_amount.toFixed(2)}` : ''}

${notes ? `Additional Notes:\n${notes}\n` : ''}

We'll keep you updated as the deal progresses. If you have any questions, please don't hesitate to contact us.

Best regards,
MyBeatFi Team

---
This notification was sent via MyBeatFi Deal Tracking System
For support, contact: support@mybeatfi.io`

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Deal Update: ${track_title}</title>
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
        .status-card {
          background: #f8f9fa;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .status-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
        .deal-details {
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .deal-details h3 {
          margin: 0 0 10px 0;
          color: #1976d2;
        }
        .deal-details p {
          margin: 5px 0;
        }
        .notes {
          background: #fff3e0;
          border: 1px solid #ffcc02;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .notes h3 {
          margin: 0 0 10px 0;
          color: #f57c00;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎵 MyBeatFi Deal Update</h1>
        <p>Professional Music Licensing & Sync Placements</p>
      </div>
      <div class="content">
        <p>Dear <strong>${producer_name}</strong>,</p>
        
        <div class="status-card">
          <div class="status-icon">${statusEmojis[deal_status as keyof typeof statusEmojis]}</div>
          <h2>Deal Update: "${track_title}"</h2>
          <p><strong>${statusMessages[deal_status as keyof typeof statusMessages]}</strong></p>
        </div>

        ${deal_value ? `
        <div class="deal-details">
          <h3>💰 Deal Details</h3>
          <p><strong>Deal Value:</strong> ${deal_currency} ${deal_value.toFixed(2)}</p>
          ${commission_amount ? `<p><strong>Your Commission:</strong> ${deal_currency} ${commission_amount.toFixed(2)}</p>` : ''}
        </div>
        ` : ''}

        ${notes ? `
        <div class="notes">
          <h3>📝 Additional Notes</h3>
          <p>${notes.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}

        <p>We'll keep you updated as the deal progresses. If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>
        <strong>MyBeatFi Team</strong></p>
      </div>
      <div class="footer">
        <p>This notification was sent via MyBeatFi Deal Tracking System</p>
        <p>For support, contact: <a href="mailto:support@mybeatfi.io">support@mybeatfi.io</a></p>
      </div>
    </body>
    </html>
  `

  return { text: textBody, html: htmlBody }
}
