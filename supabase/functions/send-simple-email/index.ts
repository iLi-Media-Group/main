import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
}

serve(async (req) => {
  console.log('Email function called with method:', req.method)
  console.log('Email function headers:', Object.fromEntries(req.headers.entries()))
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request for email function')
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const { to, subject, html, text, producerData } = await req.json()
    console.log('Email function received data:', { to, subject, hasHtml: !!html, hasText: !!text })

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      console.error('Missing required fields:', { to, subject, hasHtml: !!html, hasText: !!text })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, and html or text' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Gmail credentials
    const gmailUser = Deno.env.get('GMAIL_USER')
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD')
    
    if (!gmailUser || !gmailPassword) {
      console.error('Missing Gmail credentials')
      return new Response(
        JSON.stringify({ error: 'Gmail credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Attempting to send email via Gmail API...')
    
    // Use Gmail API via HTTP instead of SMTP
    const emailContent = html || text
    const emailData = {
      raw: btoa(
        `From: ${gmailUser}\r\n` +
        `To: ${to}\r\n` +
        `Subject: ${subject}\r\n` +
        `Content-Type: text/html; charset=UTF-8\r\n` +
        `\r\n` +
        `${emailContent}`
      ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    }

    try {
      // Try to send via Gmail API (requires different setup)
      // For now, we'll simulate success and log the attempt
      console.log('Email content prepared:', {
        from: gmailUser,
        to: to,
        subject: subject,
        contentLength: emailContent.length
      })
      
      // Simulate email sending (in production, you'd use Gmail API or a service like SendGrid)
      console.log('Email would be sent to:', to)
      console.log('Subject:', subject)
      console.log('Content preview:', emailContent.substring(0, 200) + '...')
      
    } catch (apiError) {
      console.error('Gmail API error:', apiError)
      throw new Error(`Failed to send email via Gmail API: ${apiError.message}`)
    }

    // Create Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Log the email attempt
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        to_email: to,
        subject: subject,
        sent_at: new Date().toISOString(),
        status: 'simulated_sent' // Changed to indicate this is a simulation
      })

    if (logError) {
      console.error('Email logging error:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email prepared and logged (simulation mode - check logs for details)',
        to: to,
        subject: subject,
        note: 'This is a simulation. In production, implement Gmail API or use a service like SendGrid.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Email sending error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send email' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
