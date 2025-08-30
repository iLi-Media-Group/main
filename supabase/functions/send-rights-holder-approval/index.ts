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

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Send approval email using Supabase's built-in email service
    const { error: emailError } = await supabaseClient.auth.admin.sendRawEmail({
      to: email,
      subject: 'Your Rights Holder Application Has Been Approved!',
      html: `
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
    });

    if (emailError) {
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

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
