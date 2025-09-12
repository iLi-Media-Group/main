import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      companyName, 
      contactFirstName, 
      contactLastName, 
      rightsHolderNumber 
    } = await req.json();

    // Validate required fields
    if (!email || !companyName || !rightsHolderNumber) {
      throw new Error('Missing required fields: email, companyName, or rightsHolderNumber');
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

    // Prepare email content
    const subject = 'Your Rights Holder Application Has Been Approved!'
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Application Approved!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Welcome to MyBeatFi</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Congratulations and welcome!</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Your MyBeatFi application has been approved and your dashboard is now available. 
            Your username is your email. You need to log in with the password you signed up with.
          </p>
          
          <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1976d2;">Your Account Details</h3>
            <p style="margin: 5px 0; color: #555;">
              <strong>Rights Holder Number:</strong> ${rightsHolderNumber}<br>
              <strong>Email:</strong> ${email}<br>
              <strong>Login URL:</strong> <a href="https://mybeatfi.io/rights-holder/login" style="color: #2196f3;">https://mybeatfi.io/rights-holder/login</a>
            </p>
          </div>
          
          <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #f57c00;">Login Information</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li><strong>Username:</strong> ${email}</li>
              <li><strong>Password:</strong> Use the password you created during signup</li>
              <li>Your dashboard is now fully accessible</li>
              <li>You can start uploading and managing your music rights immediately</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://mybeatfi.io/rights-holder/login" 
               style="background: #2196f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Login to MyBeatFi
            </a>
          </div>
          
          <p style="color: #777; font-size: 14px; text-align: center; margin-top: 30px;">
            Thank you for choosing MyBeatFi for your music rights management needs!
          </p>
        </div>
      </div>
    `

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MyBeatFi <noreply@mybeatfi.io>',
        to: [email],
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
    console.log('Approval email sent successfully:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Approval email sent successfully',
        email: email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Send rights holder approval email error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
