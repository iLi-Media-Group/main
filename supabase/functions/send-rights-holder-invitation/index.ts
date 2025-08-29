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
    const { email, companyName, contactFirstName, contactLastName, rightsHolderNumber, invitationCode } = await req.json()

    // Validate required fields
    if (!email || !companyName || !contactFirstName || !contactLastName || !rightsHolderNumber || !invitationCode) {
      throw new Error('Missing required fields')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Email template for rights holder invitation
    const emailSubject = `🎵 Welcome to MyBeatFi - Your Rights Holder Invitation`
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MyBeatFi Rights Holder Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .code { background: #e8f4fd; border: 2px dashed #667eea; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎵 Welcome to MyBeatFi</h1>
            <p>Your Rights Holder Invitation</p>
          </div>
          
          <div class="content">
            <h2>Hello ${contactFirstName},</h2>
            
            <p>Congratulations! We're excited to invite <strong>${companyName}</strong> to join MyBeatFi as a Rights Holder.</p>
            
            <p>Your application has been approved, and we're ready to help you maximize your music licensing opportunities.</p>
            
            <h3>Your Rights Holder Information:</h3>
            <ul>
              <li><strong>Company:</strong> ${companyName}</li>
              <li><strong>Rights Holder Number:</strong> ${rightsHolderNumber}</li>
              <li><strong>Contact:</strong> ${contactFirstName} ${contactLastName}</li>
            </ul>
            
            <h3>Next Steps:</h3>
            <p>To complete your onboarding, please use the invitation code below to create your account:</p>
            
            <div class="code">
              ${invitationCode}
            </div>
            
                               <p style="text-align: center;">
                     <a href="https://mybeatfi.io/rights-holder/signup" class="button">Create Your Account</a>
                   </p>
            
            <h3>What You'll Get:</h3>
            <ul>
              <li>Access to our comprehensive licensing platform</li>
              <li>Direct connection with music supervisors and content creators</li>
              <li>Advanced analytics and revenue tracking</li>
              <li>Dedicated support team</li>
              <li>Exclusive rights holder features and tools</li>
            </ul>
            
            <p><strong>Important:</strong> This invitation code expires in 7 days. Please create your account as soon as possible.</p>
            
            <p>If you have any questions or need assistance, please don't hesitate to reach out to our team.</p>
            
            <p>Welcome to the MyBeatFi family!</p>
            
            <p>Best regards,<br>
            The MyBeatFi Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 MyBeatFi. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email using Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MyBeatFi <noreply@mybeatfi.io>',
        to: email,
        subject: emailSubject,
        html: emailHtml,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text()
      throw new Error(`Failed to send email: ${resendResponse.status} ${errorData}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Rights holder invitation email sent successfully',
        rightsHolderNumber,
        invitationCode
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending rights holder invitation:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
