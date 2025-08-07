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
    console.log('Configuring Algolia index...')

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

    // Configure searchable attributes
    await tracksIndex.setSettings({
      searchableAttributes: [
        'title',
        'artist',
        'genres',
        'moods', 
        'sub_genres',
        'searchableText'
      ],
      attributesForFaceting: [
        'genres',
        'moods',
        'sub_genres',
        'has_vocals',
        'is_sync_only',
        'has_sting_ending',
        'is_one_stop'
      ],
      ranking: [
        'typo',
        'geo',
        'words',
        'filters',
        'proximity',
        'attribute',
        'exact',
        'custom'
      ],
      customRanking: [
        'desc(created_at)'
      ],
      attributesToHighlight: [
        'title',
        'artist',
        'genres',
        'moods'
      ],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>'
    })

    console.log('Algolia index configured successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Algolia index configured successfully',
        searchableAttributes: [
          'title',
          'artist', 
          'genres',
          'moods',
          'sub_genres',
          'searchableText'
        ]
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Configuration error:', error)
    return new Response(
      JSON.stringify({ error: 'Configuration failed', details: error.message }),
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
