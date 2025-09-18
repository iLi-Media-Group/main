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
    const { to, subject, html, text } = await req.json()

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

    // Use Deno's built-in fetch to send email via a simple SMTP service
    // We'll use a free service like EmailJS or a simple SMTP relay
    
    // Option 1: Use EmailJS (free, easy setup)
    const emailjsUrl = 'https://api.emailjs.com/api/v1.0/email/send'
    const emailjsData = {
      service_id: Deno.env.get('EMAILJS_SERVICE_ID') || 'default_service',
      template_id: Deno.env.get('EMAILJS_TEMPLATE_ID') || 'template_id',
      user_id: Deno.env.get('EMAILJS_USER_ID') || 'user_id',
      template_params: {
        to_email: to,
        subject: subject,
        message_html: html,
        message_text: text
      }
    }

    const emailjsResponse = await fetch(emailjsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailjsData)
    })

    if (!emailjsResponse.ok) {
      throw new Error(`EmailJS error: ${emailjsResponse.statusText}`)
    }

    // Log the email for tracking
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        to_email: to,
        subject: subject,
        sent_at: new Date().toISOString(),
        status: 'sent'
      })

    if (logError) {
      console.error('Email logging error:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully' 
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
