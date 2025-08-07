import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import algoliasearch from 'npm:algoliasearch@4.18.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Always add CORS headers to all responses
  const addCorsHeaders = (response: Response) => {
    const newHeaders = new Headers(response.headers)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value)
    })
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    })
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  // Simple health check endpoint
  if (req.method === 'GET') {
    return addCorsHeaders(new Response(
      JSON.stringify({ status: 'ok', message: 'Algolia search function is running' }),
      { 
        headers: { 'Content-Type': 'application/json' } 
      }
    ))
  }

  try {
    console.log('Algolia search request received:', { method: req.method, url: req.url })
    
    const { query, filters } = await req.json()

    // Initialize Algolia client
    const appId = Deno.env.get('VITE_ALGOLIA_APP_ID') || ''
    const searchKey = Deno.env.get('VITE_ALGOLIA_SEARCH_KEY') || ''
    
    console.log('Algolia credentials:', { appId: appId ? 'set' : 'missing', searchKey: searchKey ? 'set' : 'missing' })
    
    if (!appId || !searchKey) {
      return addCorsHeaders(new Response(
        JSON.stringify({ error: 'Algolia credentials not configured' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' } 
        }
      ))
    }
    
    const searchClient = algoliasearch(appId, searchKey)
    const tracksIndex = searchClient.initIndex('tracks')

    const searchParams: any = {
      query,
      hitsPerPage: 20,
      attributesToRetrieve: [
        'id',
        'title',
        'artist',
        'genres',
        'sub_genres',
        'moods',
        'bpm',
        'audio_url',
        'image_url',
        'has_sting_ending',
        'is_one_stop',
        'duration',
        'mp3_url',
        'trackouts_url',
        'stems_url',
        'has_vocals',
        'vocals_usage_type',
        'is_sync_only',
        'track_producer_id',
        'producer',
        'created_at'
      ],
      attributesToHighlight: ['title', 'artist', 'genres', 'moods'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>'
    }

    // Add filters
    if (filters) {
      const facetFilters: string[] = []
      
      if (filters.isSyncOnly !== undefined) {
        facetFilters.push(`is_sync_only:${filters.isSyncOnly}`)
      }
      
      if (filters.hasVocals !== undefined) {
        facetFilters.push(`has_vocals:${filters.hasVocals}`)
      }
      
      if (filters.minBpm !== undefined || filters.maxBpm !== undefined) {
        const bpmFilter = []
        if (filters.minBpm !== undefined) {
          bpmFilter.push(`bpm >= ${filters.minBpm}`)
        }
        if (filters.maxBpm !== undefined) {
          bpmFilter.push(`bpm <= ${filters.maxBpm}`)
        }
        searchParams.filters = bpmFilter.join(' AND ')
      }
      
      if (filters.genres && filters.genres.length > 0) {
        facetFilters.push(`genres:${filters.genres.join(' OR ')}`)
      }
      
      if (filters.moods && filters.moods.length > 0) {
        facetFilters.push(`moods:${filters.moods.join(' OR ')}`)
      }
      
      if (facetFilters.length > 0) {
        searchParams.facetFilters = facetFilters
      }
    }

    const { hits, nbHits, page, nbPages } = await tracksIndex.search(query, searchParams)
    
    const results = {
      tracks: hits,
      totalHits: nbHits,
      currentPage: page,
      totalPages: nbPages
    }

    return addCorsHeaders(new Response(
      JSON.stringify(results),
      { 
        headers: { 'Content-Type': 'application/json' } 
      }
    ))

  } catch (error) {
    console.error('Algolia search error:', error)
    return addCorsHeaders(new Response(
      JSON.stringify({ error: 'Search failed', details: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    ))
  }
})
