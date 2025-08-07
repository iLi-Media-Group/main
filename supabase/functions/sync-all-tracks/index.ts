import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import algoliasearch from 'npm:algoliasearch@4.22.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  // Check for authorization header
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { 
        status: 401,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }

  try {
    console.log('Starting manual sync of all tracks to Algolia...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Initialize Algolia client
    const appId = Deno.env.get('VITE_ALGOLIA_APP_ID') || ''
    const adminKey = Deno.env.get('ALGOLIA_ADMIN_KEY') || ''
    
    if (!appId || !adminKey) {
      return new Response(
        JSON.stringify({ error: 'Algolia credentials not configured' }),
        { 
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    const searchClient = algoliasearch(appId, adminKey)
    const tracksIndex = searchClient.initIndex('tracks')

    // Fetch all tracks from Supabase
    const { data: tracks, error } = await supabase
      .from('tracks')
      .select(`
        id,
        title,
        genres,
        sub_genres,
        moods,
        instruments,
        bpm,
        duration,
        audio_url,
        image_url,
        has_sting_ending,
        is_one_stop,
        has_vocals,
        vocals_usage_type,
        is_sync_only,
        track_producer_id,
        mp3_url,
        trackouts_url,
        stems_url,
        created_at,
        producer:profiles!track_producer_id (
          id,
          first_name,
          last_name,
          email,
          avatar_path
        )
      `)
      .is('deleted_at', null)

    if (error) {
      console.error('Supabase error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tracks from Supabase' }),
        { 
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    console.log(`Found ${tracks.length} tracks to sync`)

    // Format tracks for Algolia
    const formattedTracks = tracks.map(track => ({
      objectID: track.id,
      id: track.id,
      title: track.title || 'Untitled',
      artist: track.producer?.first_name || 
              track.producer?.email?.split('@')[0] || 
              'Unknown Artist',
      genres: track.genres || [],
      sub_genres: track.sub_genres || [],
      moods: track.moods || [],
      instruments: track.instruments || [],
      bpm: track.bpm,
      duration: track.duration || '3:30',
      audio_url: track.audio_url,
      image_url: track.image_url,
      has_sting_ending: track.has_sting_ending || false,
      is_one_stop: track.is_one_stop || false,
      has_vocals: track.has_vocals || false,
      vocals_usage_type: track.vocals_usage_type,
      is_sync_only: track.is_sync_only || false,
      track_producer_id: track.track_producer_id,
      producer: track.producer ? {
        id: track.producer.id,
        firstName: track.producer.first_name || '',
        lastName: track.producer.last_name || '',
        email: track.producer.email || '',
        avatarPath: track.producer.avatar_path || '',
      } : undefined,
      mp3_url: track.mp3_url,
      trackouts_url: track.trackouts_url,
      stems_url: track.stems_url,
      created_at: track.created_at,
      // Add searchable text field
      searchableText: [
        track.title,
        track.producer?.first_name,
        track.producer?.last_name,
        track.producer?.email?.split('@')[0],
        ...(track.genres || []),
        ...(track.sub_genres || []),
        ...(track.moods || []),
        ...(track.instruments || []),
        ...(track.media_usage || [])
      ].filter(Boolean).join(' ')
    }))

    // Save all tracks to Algolia
    await tracksIndex.saveObjects(formattedTracks)
    
    console.log(`Successfully synced ${formattedTracks.length} tracks to Algolia`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${formattedTracks.length} tracks to Algolia`,
        tracksCount: formattedTracks.length
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: 'Sync failed', details: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
