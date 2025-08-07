import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import algoliasearch from 'https://esm.sh/algoliasearch@4.18.1'

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
    const { query, filters } = await req.json()

    // Initialize Algolia client
    const searchClient = algoliasearch(
      Deno.env.get('VITE_ALGOLIA_APP_ID') || '',
      Deno.env.get('VITE_ALGOLIA_SEARCH_KEY') || ''
    )

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

    return new Response(
      JSON.stringify(results),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Algolia search error:', error)
    return new Response(
      JSON.stringify({ error: 'Search failed' }),
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
