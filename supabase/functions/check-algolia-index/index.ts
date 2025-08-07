import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import algoliasearch from 'npm:algoliasearch@4.22.0'

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
    console.log('Checking Algolia index...')

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

    // Get index settings
    const settings = await tracksIndex.getSettings()
    
    // Search for jazz tracks
    const jazzResults = await tracksIndex.search('jazz', {
      hitsPerPage: 10,
      attributesToRetrieve: ['title', 'artist', 'genres', 'moods', 'sub_genres', 'searchableText']
    })

    // Search for any tracks
    const allResults = await tracksIndex.search('', {
      hitsPerPage: 10,
      attributesToRetrieve: ['title', 'artist', 'genres', 'moods', 'sub_genres', 'searchableText']
    })

    console.log('Algolia index check completed')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Algolia index check completed',
        settings: {
          searchableAttributes: settings.searchableAttributes,
          attributesForFaceting: settings.attributesForFaceting
        },
        jazzSearchResults: {
          hits: jazzResults.hits,
          nbHits: jazzResults.nbHits,
          query: 'jazz'
        },
        allTracksResults: {
          hits: allResults.hits,
          nbHits: allResults.nbHits,
          query: 'empty string'
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Index check error:', error)
    return new Response(
      JSON.stringify({ error: 'Index check failed', details: error.message }),
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
