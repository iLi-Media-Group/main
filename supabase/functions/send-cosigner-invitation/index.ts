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
    const { 
      coSignerId, 
      coSignerName, 
      coSignerEmail, 
      trackTitle, 
      rightsHolderName,
      splitSheetUrl 
    } = await req.json()

    // Validate required fields
    if (!coSignerId || !coSignerName || !coSignerEmail || !trackTitle || !rightsHolderName) {
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

    // Generate a unique signature token
    const signatureToken = crypto.randomUUID()

    // Update the co-signer record with the signature token and mark as invited
    const { error: updateError } = await supabase
      .from('co_signers')
      .update({ 
        signature_token: signatureToken,
        invited: true,
        invited_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      })
      .eq('id', coSignerId)

    if (updateError) {
      console.error('Error updating co-signer:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update co-signer record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the signature URL
    const baseUrl = Deno.env.get('SITE_URL') || 'https://mybeatfi.io'
    const signatureUrl = `${baseUrl}/sign-split-sheet?token=${signatureToken}&id=${coSignerId}`

    // Email template
    const emailSubject = `📝 Split Sheet Signature Required - ${trackTitle}`
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Split Sheet Signature Required</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .track-info { background: #e3f2fd; border: 1px solid #bbdefb; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Split Sheet Signature Required</h1>
            <p>You've been invited to sign a split sheet agreement</p>
        </div>
        <div class="content">
            <p>Dear ${coSignerName},</p>
            
            <p>You have been invited to sign a split sheet agreement for the following track:</p>
            
            <div class="track-info">
                <h3>Track Information</h3>
                <p><strong>Title:</strong> ${trackTitle}</p>
                <p><strong>Rights Holder:</strong> ${rightsHolderName}</p>
            </div>
            
            <p>This split sheet documents the ownership and royalty splits for this recording. Your signature is required to finalize the agreement.</p>
            
            <div class="highlight">
                <h3>⚠️ Important Information:</h3>
                <ul>
                    <li>This signature link will expire in 7 days</li>
                    <li>Please review the split sheet carefully before signing</li>
                    <li>Your signature indicates agreement to the terms outlined</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="${signatureUrl}" class="button">Sign Split Sheet Now</a>
            </div>
            
            <p>If you have any questions about this agreement or need to discuss the terms, please contact ${rightsHolderName} directly.</p>
            
            <p>Thank you for your prompt attention to this matter.</p>
            
            <p>Best regards,<br>The MyBeatFi Team</p>
        </div>
        <div class="footer">
            <p>This email was sent by MyBeatFi.io | iLi Media Group, LLC</p>
            <p>If you did not expect this invitation, please ignore this email.</p>
        </div>
    </div>
</body>
</html>
    `.trim()

    // Send email using Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MyBeatFi <noreply@mybeatfi.io>",
        to: [coSignerEmail],
        subject: emailSubject,
        html: emailHtml
      }),
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      console.error('Resend API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the email
    await supabase
      .from('email_logs')
      .insert({
        to_email: coSignerEmail,
        subject: emailSubject,
        status: 'sent',
        metadata: {
          type: 'cosigner_invitation',
          co_signer_id: coSignerId,
          track_title: trackTitle
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Co-signer invitation sent successfully',
        signatureToken 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending co-signer invitation:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
