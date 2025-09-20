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
      rightsHolderType,
      businessStructure,
      phone,
      address
    } = await req.json()

    // Validate required fields
    if (!rightsHolderEmail || !rightsHolderName) {
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

    // Get admin email from environment or use default
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@mybeatfi.io'

    const subject = `🔔 New Rights Holder Application: ${companyName || rightsHolderName}`
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Rights Holder Application</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .info-item { background: #f1f5f9; padding: 15px; border-radius: 6px; }
          .info-label { font-weight: bold; color: #475569; font-size: 14px; }
          .info-value { color: #1e293b; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Rights Holder Application</h1>
            <p>A new rights holder has submitted an application for review</p>
          </div>
          <div class="content">
            <h2>Application Details</h2>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Applicant Name</div>
                <div class="info-value">${rightsHolderName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${rightsHolderEmail}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Company Name</div>
                <div class="info-value">${companyName || 'Not provided'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Rights Holder Type</div>
                <div class="info-value">${rightsHolderType ? rightsHolderType.replace('_', ' ').toUpperCase() : 'Not specified'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Business Structure</div>
                <div class="info-value">${businessStructure ? businessStructure.replace('_', ' ').toUpperCase() : 'Not specified'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Phone</div>
                <div class="info-value">${phone || 'Not provided'}</div>
              </div>
            </div>
            
            ${address ? `
              <div class="info-item" style="grid-column: 1 / -1;">
                <div class="info-label">Address</div>
                <div class="info-value">${address}</div>
              </div>
            ` : ''}
            
            <p><strong>Action Required:</strong> Please review this application and approve or deny the rights holder account.</p>
            
            <div style="text-align: center;">
              <a href="https://mybeatfi.io/admin/rights-verification" class="button">
                Review Application
              </a>
            </div>
            
            <p><strong>Review Process:</strong></p>
            <ol>
              <li>Click the "Review Application" button above</li>
              <li>Review the applicant's information and any uploaded documents</li>
              <li>Use the "Approve" or "Deny" buttons to make your decision</li>
              <li>Add any notes or comments about your decision</li>
              <li>The applicant will be automatically notified of your decision</li>
            </ol>
          </div>
          <div class="footer">
            <p>This is an automated notification from MyBeatFi Admin System</p>
            <p>© 2024 MyBeatFi. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MyBeatFi Admin <noreply@mybeatfi.io>',
        to: [adminEmail],
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
    console.log('Notification email sent successfully:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification email sent to ${adminEmail}`,
        emailId: result.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending notification email:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send notification email' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
