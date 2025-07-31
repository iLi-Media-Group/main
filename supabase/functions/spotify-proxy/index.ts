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
    const { action, query } = await req.json()

    if (action === 'search') {
      // Get Spotify credentials from environment
      const clientId = Deno.env.get('VITE_SPOTIFY_CLIENT_ID')
      const clientSecret = Deno.env.get('VITE_SPOTIFY_CLIENT_SECRET')

      if (!clientId || !clientSecret) {
        return new Response(
          JSON.stringify({ error: 'Spotify credentials not configured' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get access token
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
        },
        body: 'grant_type=client_credentials'
      })

      if (!tokenResponse.ok) {
        throw new Error(`Token request failed: ${tokenResponse.status}`)
      }

      const tokenData = await tokenResponse.json()

      // Search for tracks
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1&market=US`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        }
      )

      if (!searchResponse.ok) {
        throw new Error(`Search request failed: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()

      return new Response(
        JSON.stringify(searchData),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Spotify proxy error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 