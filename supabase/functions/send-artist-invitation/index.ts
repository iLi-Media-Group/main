import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, artistNumber, invitationCode } = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🎵 MyBeatFi Artist Invitation</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You've been invited to join our sync licensing platform!</p>
        </div>
        
        <div style="padding: 40px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome, ${firstName}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            You've been invited to join MyBeatFi as an artist/band. This is your exclusive invitation to access our sync licensing platform and get your music featured in TV, film, and advertising.
          </p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">Your Artist Details:</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Artist Number:</strong> ${artistNumber}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Invitation Code:</strong> ${invitationCode}</p>
          </div>
          
          <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin: 0 0 15px 0;">🚀 What You'll Get:</h3>
            <ul style="color: #2e7d32; margin: 0; padding-left: 20px;">
              <li>Access to sync licensing opportunities</li>
              <li>Professional music supervision connections</li>
              <li>Revenue from TV, film, and advertising placements</li>
              <li>Artist dashboard with analytics and earnings tracking</li>
              <li>Direct licensing to major brands and content creators</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SITE_URL') || 'https://mybeatfi.io'}/signup?email=${encodeURIComponent(email)}&invitation=${invitationCode}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              🎵 Create Your Artist Account
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Important:</strong> This invitation code is unique to you and will expire in 7 days. 
              Please use it to create your account at the link above.
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If you have any questions about this invitation or need assistance setting up your account, 
            please don't hesitate to reach out to our support team.
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Welcome to the MyBeatFi family!<br>
            <strong>The MyBeatFi Team</strong>
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">© 2024 MyBeatFi. All rights reserved.</p>
          <p style="margin: 5px 0;">This email was sent to ${email}</p>
        </div>
      </div>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MyBeatFi <noreply@mybeatfi.io>',
        to: email,
        subject: `🎵 MyBeatFi Artist Invitation - ${artistNumber}`,
        html: emailContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Artist invitation email sent successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error sending artist invitation email:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
