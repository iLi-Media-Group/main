import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

  try {
    console.log('Debugging tracks data...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all tracks from Supabase
    const { data: tracks, error } = await supabase
      .from('tracks')
      .select(`
        id,
        title,
        genres,
        sub_genres,
        moods,
        bpm,
        duration,
        producer:profiles!track_producer_id (
          first_name,
          last_name
        )
      `)
      .is('deleted_at', null)
      .limit(10)

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

    // Analyze the data
    const allGenres = new Set()
    const allMoods = new Set()
    const allSubGenres = new Set()

    tracks.forEach(track => {
      if (track.genres) {
        track.genres.forEach(genre => allGenres.add(genre))
      }
      if (track.moods) {
        track.moods.forEach(mood => allMoods.add(mood))
      }
      if (track.sub_genres) {
        track.sub_genres.forEach(subGenre => allSubGenres.add(subGenre))
      }
    })

    const analysis = {
      totalTracks: tracks.length,
      sampleTracks: tracks.slice(0, 3).map(track => ({
        id: track.id,
        title: track.title,
        genres: track.genres,
        moods: track.moods,
        sub_genres: track.sub_genres,
        producer: track.producer?.first_name
      })),
      allGenres: Array.from(allGenres),
      allMoods: Array.from(allMoods),
      allSubGenres: Array.from(allSubGenres)
    }

    console.log('Track analysis:', analysis)

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Debug error:', error)
    return new Response(
      JSON.stringify({ error: 'Debug failed', details: error.message }),
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
