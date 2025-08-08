import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text, producerData } = await req.json()

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, and html or text' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use a simple email service - we'll use a webhook-based service
    // This is a simple approach that works without complex SMTP setup
    
    // Option 1: Use a webhook service like webhook.site for testing
    // Option 2: Use a simple email API service
    
    // For now, let's simulate email sending and log it
    console.log('Email would be sent:', {
      to,
      subject,
      html: html ? 'HTML content present' : 'No HTML',
      text: text ? 'Text content present' : 'No text',
      producerData
    })

    // Create Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Log the email for tracking
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        to_email: to,
        subject: subject,
        sent_at: new Date().toISOString(),
        status: 'sent',
        error_message: 'Email logged for manual sending'
      })

    if (logError) {
      console.error('Email logging error:', logError)
    }

    // For now, return success but note that email needs to be sent manually
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email logged successfully. Please send manually or configure email service.',
        note: 'Email service not configured. Check email_logs table for details.'
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
