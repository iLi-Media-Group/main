import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
}

serve(async (req) => {
  console.log('Send brief submission function called with method:', req.method)
  console.log('Edge function version: 2.0 - Updated for playlists table')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request')
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const { 
      opportunity_id,
      submission_type,
      playlist_id,
      track_id,
      message,
      submitted_by,
      submission_email,
      brief_title
    } = await req.json()

    console.log('Submission data:', {
      opportunity_id,
      submission_type,
      playlist_id,
      track_id,
      message: message?.substring(0, 100) + '...',
      submitted_by,
      submission_email,
      brief_title
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get submitter info
    const { data: submitterData, error: submitterError } = await supabase
      .from('profiles')
      .select('display_name, first_name, last_name, email')
      .eq('id', submitted_by)
      .single()

    if (submitterError) {
      console.error('Error fetching submitter data:', submitterError)
      throw new Error('Failed to fetch submitter information')
    }

    const submitterName = submitterData.display_name || 
                         `${submitterData.first_name || ''} ${submitterData.last_name || ''}`.trim() || 
                         submitterData.email

    let submissionContent = ''
    let trackLinks = ''

    if (submission_type === 'playlist' && playlist_id) {
      console.log('Fetching playlist data for playlist_id:', playlist_id)
      
      // Get playlist details from main playlists table
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('name, description')
        .eq('id', playlist_id)
        .single()

      console.log('Playlist query result:', { playlistData, playlistError })

      if (playlistError) {
        console.error('Error fetching playlist data:', playlistError)
        throw new Error('Failed to fetch playlist information')
      }

      // Get playlist tracks separately
      console.log('Fetching playlist tracks for playlist_id:', playlist_id)
      
      const { data: playlistTracksData, error: playlistTracksError } = await supabase
        .from('playlist_tracks')
        .select(`
          track_id,
          tracks (
            id,
            title,
            genres,
            moods,
            duration,
            audio_url,
            profiles!tracks_track_producer_id_fkey (
              display_name,
              first_name,
              last_name
            )
          )
        `)
        .eq('playlist_id', playlist_id)

      console.log('Playlist tracks query result:', { playlistTracksData, playlistTracksError })

      if (playlistTracksError) {
        console.error('Error fetching playlist tracks:', playlistTracksError)
        throw new Error('Failed to fetch playlist tracks')
      }

      submissionContent = `Playlist: ${playlistData.name}`
      trackLinks = playlistTracksData?.map((pt: any) => {
        const track = pt.tracks
        if (!track) return ''
        const producerName = track.profiles?.display_name || 
                           `${track.profiles?.first_name || ''} ${track.profiles?.last_name || ''}`.trim() || 
                           'Unknown'
        const genre = Array.isArray(track.genres) ? track.genres[0] || 'Unknown' : 'Unknown'
        return `• ${track.title} - ${producerName} (${genre})`
      }).join('\n') || ''

    } else if (submission_type === 'track' && track_id) {
      // Get track details
      const { data: trackData, error: trackError } = await supabase
        .from('tracks')
        .select(`
          title,
          genres,
          moods,
          duration,
          audio_url,
          profiles!tracks_track_producer_id_fkey (
            display_name,
            first_name,
            last_name
          )
        `)
        .eq('id', track_id)
        .single()

      if (trackError) {
        console.error('Error fetching track data:', trackError)
        throw new Error('Failed to fetch track information')
      }

      const producerName = trackData.profiles?.display_name || 
                         `${trackData.profiles?.first_name || ''} ${trackData.profiles?.last_name || ''}`.trim() || 
                         'Unknown'

      const genre = Array.isArray(trackData.genres) ? trackData.genres[0] || 'Unknown' : 'Unknown'

      submissionContent = `Track: ${trackData.title} - ${producerName}`
      trackLinks = `• ${trackData.title} - ${producerName} (${genre})`
    }

    // Prepare email content
    const emailSubject = `Pitch Submission: ${brief_title}`
    const emailBody = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
      Pitch Submission
    </h2>
    
    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1e40af;">Brief: ${brief_title}</h3>
      <p><strong>Submitted by:</strong> ${submitterName}</p>
      <p><strong>Submission:</strong> ${submissionContent}</p>
    </div>

    <div style="margin: 20px 0;">
      <h3 style="color: #1e40af;">Tracks Included:</h3>
      <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px;">
        <pre style="white-space: pre-wrap; margin: 0; font-family: Arial, sans-serif;">${trackLinks}</pre>
      </div>
    </div>

    <div style="margin: 20px 0;">
      <h3 style="color: #1e40af;">Message:</h3>
      <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px;">
        <p style="margin: 0;">${message}</p>
      </div>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
      <p>This submission was sent via MyBeatFi Pitch Service.</p>
    </div>
  </div>
</body>
</html>
    `

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('Resend API key not configured')
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MyBeatFi Pitch Service <noreply@mybeatfi.io>',
        to: [submission_email],
        subject: emailSubject,
        html: emailBody,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Resend API error:', errorData)
      throw new Error('Failed to send email')
    }

    const emailResult = await emailResponse.json()
    console.log('Email sent successfully:', emailResult.id)

    // Log to pitch analytics
    try {
      await supabase
        .from('pitch_analytics')
        .insert({
          user_id: submitted_by,
          opportunity_id: opportunity_id,
          metric_type: 'email_sent',
          metric_value: 1,
          metric_details: {
            submission_type,
            playlist_id: submission_type === 'playlist' ? playlist_id : null,
            track_id: submission_type === 'track' ? track_id : null,
            email_id: emailResult.id
          }
        })
    } catch (analyticsError) {
      console.error('Error logging to analytics:', analyticsError)
      // Don't fail the whole request for analytics errors
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Submission sent successfully',
        email_id: emailResult.id
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Send brief submission function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send brief submission' 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
