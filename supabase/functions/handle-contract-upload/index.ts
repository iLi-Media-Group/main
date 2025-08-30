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
    const { contractId, contractType, recipientEmail, recipientName, clientName, projectTitle } = await req.json()

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get contract details
    const { data: contractData, error: contractError } = await supabaseClient
      .from('client_contracts')
      .select(`
        *,
        sync_proposal:sync_proposals(
          project_type,
          track:tracks(
            title,
            producer:profiles!tracks_track_producer_id_fkey(email, first_name, last_name)
          )
        ),
        custom_sync_request:custom_sync_requests(
          project_title,
          selected_producer:profiles!custom_sync_requests_selected_producer_id_fkey(email, first_name, last_name)
        )
      `)
      .eq('id', contractId)
      .single()

    if (contractError) {
      throw new Error(`Failed to fetch contract data: ${contractError.message}`)
    }

    // Determine recipient information
    let recipientInfo = {
      email: recipientEmail,
      name: recipientName
    }

    let projectInfo = {
      title: projectTitle
    }

    if (contractType === 'sync_proposal' && contractData.sync_proposal) {
      recipientInfo = {
        email: contractData.sync_proposal.track.producer.email,
        name: `${contractData.sync_proposal.track.producer.first_name} ${contractData.sync_proposal.track.producer.last_name}`
      }
      projectInfo = {
        title: contractData.sync_proposal.project_type
      }
    } else if (contractType === 'custom_sync_request' && contractData.custom_sync_request) {
      recipientInfo = {
        email: contractData.custom_sync_request.selected_producer.email,
        name: `${contractData.custom_sync_request.selected_producer.first_name} ${contractData.custom_sync_request.selected_producer.last_name}`
      }
      projectInfo = {
        title: contractData.custom_sync_request.project_title
      }
    }

    // Send email notification
    const emailData = {
      to: recipientInfo.email,
      subject: `Contract Uploaded for ${projectInfo.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Contract Uploaded</h2>
          <p>Hello ${recipientInfo.name},</p>
          <p>A client contract has been uploaded for the project: <strong>${projectInfo.title}</strong></p>
          <p>Please review and sign the contract before files can be made available to the client.</p>
          <p>You can access the contract through your dashboard.</p>
          <br>
          <p>Best regards,<br>MyBeatFi Team</p>
        </div>
      `
    }

    // Use Resend API to send email
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      throw new Error(`Failed to send email: ${errorData.message}`)
    }

    // Update contract record to mark email as sent
    const { error: updateError } = await supabaseClient
      .from('client_contracts')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', contractId)

    if (updateError) {
      console.error('Failed to update contract email status:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contract upload notification sent successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in handle-contract-upload:', error)
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
