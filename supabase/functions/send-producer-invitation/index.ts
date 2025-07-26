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

    // Email template
    const emailSubject = `🎉 Congratulations! You've Been Accepted as a MyBeatFi Producer`
    
    const emailBody = `
Dear ${firstName} ${lastName},

🎵 **CONGRATULATIONS!** 🎵

We are thrilled to inform you that your producer application has been reviewed and **ACCEPTED**! 

Your dedication to music production and the quality of your work has impressed our team. We're excited to welcome you to the MyBeatFi family!

📋 **Your Producer Details:**
- **Producer Number:** ${producerNumber}
- **Email:** ${email}
- **Status:** ACCEPTED

🔑 **Next Steps:**
1. Use your Producer Number (${producerNumber}) to sign up at: https://mybeatfi.io/signup
2. Complete your profile setup
3. Start uploading your tracks and connecting with clients

💡 **What's Next:**
- Access to our exclusive producer dashboard
- Direct client connections
- Sync licensing opportunities
- Revenue sharing on successful placements

🎯 **Your Producer Number is your unique identifier - keep it safe!**

If you have any questions or need assistance with the signup process, please don't hesitate to reach out to our support team.

Welcome to MyBeatFi!

Best regards,
The MyBeatFi Team
https://mybeatfi.io

---
*This is an automated message. Please do not reply to this email.*
    `.trim()

    // Send email using Supabase's built-in email service
    const { error: emailError } = await supabase.auth.admin.sendRawEmail({
      to: email,
      subject: emailSubject,
      html: emailBody.replace(/\n/g, '<br>'),
      text: emailBody
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
