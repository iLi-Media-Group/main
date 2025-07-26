import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend'

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
    const { email, firstName, lastName, producerNumber, invitationCode } = await req.json()

    // Validate required fields
    if (!email || !firstName || !lastName || !producerNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)

    // Email template
    const emailSubject = `🎉 Congratulations! You've Been Accepted as a MyBeatFi Producer`
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to MyBeatFi!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎵 Welcome to MyBeatFi! 🎵</h1>
            <h2>CONGRATULATIONS!</h2>
        </div>
        <div class="content">
            <p>Dear ${firstName} ${lastName},</p>
            
            <p>We are thrilled to inform you that your producer application has been reviewed and <strong>ACCEPTED</strong>!</p>
            
            <p>Your dedication to music production and the quality of your work has impressed our team. We're excited to welcome you to the MyBeatFi family!</p>
            
            <div class="highlight">
                <h3>📋 Your Producer Details:</h3>
                <ul>
                    <li><strong>Producer Number:</strong> ${producerNumber}</li>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Status:</strong> ACCEPTED</li>
                </ul>
            </div>
            
            <h3>🔑 Next Steps:</h3>
            <ol>
                <li>Use your Producer Number (${producerNumber}) to sign up at: <a href="https://mybeatfi.io/signup">https://mybeatfi.io/signup</a></li>
                <li>Complete your profile setup</li>
                <li>Start uploading your tracks and connecting with clients</li>
            </ol>
            
            <h3>💡 What's Next:</h3>
            <ul>
                <li>Access to our exclusive producer dashboard</li>
                <li>Direct client connections</li>
                <li>Sync licensing opportunities</li>
                <li>Revenue sharing on successful placements</li>
            </ul>
            
            <p><strong>🎯 Your Producer Number is your unique identifier - keep it safe!</strong></p>
            
            <p>If you have any questions or need assistance with the signup process, please don't hesitate to reach out to our support team.</p>
            
            <p>Welcome to MyBeatFi!</p>
            
            <p>Best regards,<br>The MyBeatFi Team</p>
            
            <a href="https://mybeatfi.io" class="button">Visit MyBeatFi</a>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `.trim()

    // Send email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'MyBeatFi <noreply@mybeatfi.io>',
      to: [email],
      subject: emailSubject,
      html: emailHtml
    })

    if (emailError) {
      console.error('Email sending error:', emailError)
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the invitation for tracking
    const { error: logError } = await supabase
      .from('producer_invitation_logs')
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        producer_number: producerNumber,
        invitation_code: invitationCode,
        email_sent: true,
        sent_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Logging error:', logError)
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully',
        producerNumber 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
