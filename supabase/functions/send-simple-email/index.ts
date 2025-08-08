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

    // Create Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Log the email for tracking (without actually sending)
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        to_email: to,
        subject: subject,
        sent_at: new Date().toISOString(),
        status: 'logged_only'
      })

    if (logError) {
      console.error('Email logging error:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email logged successfully (no actual email sent - testing mode)',
        to: to,
        subject: subject
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
