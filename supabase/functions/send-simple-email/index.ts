import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

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

    console.log('Attempting to connect to Gmail SMTP...')
    
    // Create SMTP client with more robust configuration
    const client = new SmtpClient()
    
    try {
      // Connect to Gmail SMTP with explicit TLS settings
      await client.connectTLS({
        hostname: "smtp.gmail.com",
        port: 587,
        username: gmailUser,
        password: gmailPassword,
      })
      
      console.log('Successfully connected to Gmail SMTP')
      
      // Send the email
      await client.send({
        from: gmailUser,
        to: to,
        subject: subject,
        content: html || text,
        html: html,
      })
      
      console.log('Email sent successfully via Gmail SMTP')
      
      // Close the connection
      await client.close()
      
    } catch (smtpError) {
      console.error('SMTP connection/send error:', smtpError)
      
      // Try alternative connection method
      try {
        console.log('Trying alternative SMTP connection...')
        
        // Recreate client
        const altClient = new SmtpClient()
        
        // Try port 465 with SSL
        await altClient.connectTLS({
          hostname: "smtp.gmail.com",
          port: 465,
          username: gmailUser,
          password: gmailPassword,
        })
        
        console.log('Alternative connection successful')
        
        await altClient.send({
          from: gmailUser,
          to: to,
          subject: subject,
          content: html || text,
          html: html,
        })
        
        console.log('Email sent successfully via alternative method')
        await altClient.close()
        
      } catch (altError) {
        console.error('Alternative SMTP method also failed:', altError)
        throw new Error(`SMTP failed: ${smtpError.message} | Alternative failed: ${altError.message}`)
      }
    }

    // Create Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Log the successful email
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        to_email: to,
        subject: subject,
        sent_at: new Date().toISOString(),
        status: 'sent_successfully'
      })

    if (logError) {
      console.error('Email logging error:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully via Gmail SMTP',
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
