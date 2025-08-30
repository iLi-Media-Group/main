import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
      rightsHolderEmail, 
      rightsHolderName, 
      companyName, 
      approvalStatus, 
      adminNotes 
    } = await req.json()

    // Validate required fields
    if (!rightsHolderEmail || !rightsHolderName || !approvalStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Prepare email content based on approval status
    let subject, htmlContent
    if (approvalStatus === 'approved') {
      subject = `🎉 Your Rights Holder Account Has Been Approved!`
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Approved</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Account Approved!</h1>
              <p>Welcome to MyBeatFi Rights Holder Platform</p>
            </div>
            <div class="content">
              <h2>Congratulations, ${rightsHolderName}!</h2>
              <p>Your rights holder account application has been <strong>approved</strong>!</p>
              
              <p><strong>Company:</strong> ${companyName || 'Not specified'}</p>
              
              <p>You now have full access to the MyBeatFi Rights Holder Dashboard where you can:</p>
              <ul>
                <li>Upload and manage your recordings</li>
                <li>Create and manage split sheets</li>
                <li>Track licensing and revenue</li>
                <li>Access analytics and reporting</li>
                <li>Manage e-signatures and co-signers</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="https://mybeatfi.io/rights-holder/dashboard" class="button">
                  Access Your Dashboard
                </a>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Log in to your account</li>
                <li>Complete your profile information</li>
                <li>Start uploading your recordings</li>
                <li>Set up your payment information</li>
              </ol>
              
              <p>If you have any questions or need assistance getting started, please don't hesitate to contact our support team.</p>
            </div>
            <div class="footer">
              <p>Best regards,<br>The MyBeatFi Team</p>
              <p>© 2024 MyBeatFi. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    } else {
      subject = `Rights Holder Account Application Update`
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .notes { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Update</h1>
              <p>Rights Holder Account Application</p>
            </div>
            <div class="content">
              <h2>Dear ${rightsHolderName},</h2>
              <p>Thank you for your interest in becoming a rights holder on MyBeatFi.</p>
              
              <p>After careful review of your application, we regret to inform you that your rights holder account application has been <strong>denied</strong>.</p>
              
              <p><strong>Company:</strong> ${companyName || 'Not specified'}</p>
              
              ${adminNotes ? `
                <div class="notes">
                  <h3>Review Notes:</h3>
                  <p>${adminNotes}</p>
                </div>
              ` : ''}
              
              <p><strong>Possible reasons for denial may include:</strong></p>
              <ul>
                <li>Incomplete or inaccurate business information</li>
                <li>Missing required documentation</li>
                <li>Business verification issues</li>
                <li>Compliance concerns</li>
              </ul>
              
              <p>If you believe this decision was made in error or if you would like to provide additional information, please contact our support team for assistance.</p>
              
              <div style="text-align: center;">
                <a href="mailto:support@mybeatfi.io" class="button">
                  Contact Support
                </a>
              </div>
              
              <p>You may also submit a new application in the future with updated or corrected information.</p>
            </div>
            <div class="footer">
              <p>Best regards,<br>The MyBeatFi Team</p>
              <p>© 2024 MyBeatFi. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MyBeatFi <noreply@mybeatfi.io>',
        to: [rightsHolderEmail],
        subject: subject,
        html: htmlContent,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Resend API error:', errorData)
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Email sent successfully:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Approval email sent to ${rightsHolderEmail}`,
        emailId: result.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending approval email:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send approval email' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
