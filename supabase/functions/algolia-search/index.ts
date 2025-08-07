import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import algoliasearch from 'npm:algoliasearch@4.22.0'

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

  // For POST requests, allow without authentication for public search
  console.log('Algolia search request received:', { method: req.method, url: req.url })

  try {
    console.log('Algolia search request received:', { method: req.method, url: req.url })
    
    const body = await req.json()
    console.log('Request body:', body)
    
    const { query, filters } = body

    // Initialize Algolia client
    const appId = Deno.env.get('VITE_ALGOLIA_APP_ID') || ''
    const searchKey = Deno.env.get('VITE_ALGOLIA_SEARCH_KEY') || ''
    
    console.log('Algolia credentials:', { 
      appId: appId ? 'set' : 'missing', 
      searchKey: searchKey ? 'set' : 'missing',
      appIdLength: appId.length,
      searchKeyLength: searchKey.length
    })
    
    if (!appId || !searchKey) {
      console.error('Missing Algolia credentials')
      return addCorsHeaders(new Response(
        JSON.stringify({ error: 'Algolia credentials not configured' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' } 
        }
      ))
    }
    
    console.log('Initializing Algolia client...')
    const searchClient = algoliasearch(appId, searchKey)
    const tracksIndex = searchClient.initIndex('tracks')
    console.log('Algolia client initialized successfully')

         const searchParams: any = {
       query,
       hitsPerPage: 20,
       synonyms: true, // Enable synonym matching
       queryType: 'prefixAll', // Enable prefix matching
      attributesToRetrieve: [
        'id',
        'title',
        'artist',
        'genres',
        'sub_genres',
        'moods',
        'instruments',
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
      attributesToHighlight: ['title', 'artist', 'genres', 'moods', 'instruments'],
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

                       // Clean query by removing natural language filler words
          const cleanQuery = (query: string): string => {
            const stopWords = ["i", "need", "a", "an", "the", "please", "track", "song", "music", "give", "me", "find", "for", "my", "want", "looking", "searching", "get", "some", "any", "tracks", "songs", "help", "with", "that", "this", "these", "those"]
            return query
              .toLowerCase()
              .split(" ")
              .filter(word => !stopWords.includes(word))
              .join(" ");
          }
          
          // Enhanced natural language processing with mood associations and partial word matching
          const extractKeyTerms = (query: string) => {
            const lowerQuery = query.toLowerCase()
            
            // Common words to ignore
            const stopWords = ['i', 'need', 'a', 'an', 'the', 'for', 'my', 'want', 'looking', 'searching', 'find', 'get', 'some', 'any', 'track', 'tracks', 'music', 'song', 'songs', 'please', 'help', 'me', 'with', 'that', 'this', 'these', 'those']
           
           // Mood associations - map common words to actual moods in the database
           const moodAssociations: { [key: string]: string[] } = {
             'fun': ['cheerful', 'playful', 'joyful', 'bouncy', 'energetic'],
             'dark': ['mysterious', 'haunting', 'tense', 'dramatic', 'melancholic'],
             'happy': ['cheerful', 'joyful', 'uplifting', 'positive', 'optimistic'],
             'sad': ['melancholic', 'melancholy', 'sorrowful', 'emotional'],
             'energetic': ['energetic', 'lively', 'bouncy', 'upbeat', 'dynamic'],
             'calm': ['peaceful', 'soothing', 'gentle', 'relaxing', 'tranquil'],
             'romantic': ['romantic', 'intimate', 'passionate', 'emotional'],
             'epic': ['dramatic', 'majestic', 'powerful', 'heroic', 'grand'],
             'chill': ['chill', 'laid back', 'relaxing', 'soothing', 'peaceful'],
             'upbeat': ['upbeat', 'energetic', 'lively', 'bouncy', 'cheerful'],
             'mysterious': ['mysterious', 'haunting', 'dark', 'enigmatic', 'atmospheric'],
             'peaceful': ['peaceful', 'soothing', 'gentle', 'calm', 'tranquil'],
             'dramatic': ['dramatic', 'intense', 'powerful', 'emotional', 'epic'],
             'relaxing': ['relaxing', 'soothing', 'peaceful', 'gentle', 'calm'],
             'exciting': ['energetic', 'lively', 'dynamic', 'powerful', 'intense'],
             'smooth': ['smooth', 'gentle', 'soothing', 'peaceful', 'relaxing'],
             'powerful': ['powerful', 'dramatic', 'intense', 'energetic', 'dynamic'],
             'soft': ['gentle', 'soft', 'peaceful', 'soothing', 'calm'],
             'intense': ['intense', 'dramatic', 'powerful', 'energetic', 'dynamic'],
             'gentle': ['gentle', 'soft', 'peaceful', 'soothing', 'calm'],
             'lively': ['lively', 'energetic', 'bouncy', 'cheerful', 'dynamic'],
             'melancholic': ['melancholic', 'melancholy', 'sorrowful', 'emotional'],
             'euphoric': ['euphoric', 'uplifting', 'energetic', 'positive', 'cheerful'],
             'dreamy': ['dreamy', 'ethereal', 'peaceful', 'soothing', 'gentle'],
             'stylish': ['stylish', 'cool', 'smooth', 'elegant', 'sophisticated'],
             'cool': ['cool', 'stylish', 'smooth', 'elegant', 'sophisticated'],
             'catchy': ['catchy', 'bouncy', 'cheerful', 'energetic', 'lively'],
             'encouraging': ['encouraging', 'uplifting', 'positive', 'energetic', 'cheerful'],
             'funky': ['funky', 'groovy', 'energetic', 'bouncy', 'lively'],
             'ethereal': ['ethereal', 'dreamy', 'peaceful', 'soothing', 'gentle'],
             'enchanted': ['enchanted', 'mysterious', 'ethereal', 'dreamy', 'magical'],
             'dreamlike': ['dreamlike', 'ethereal', 'dreamy', 'peaceful', 'soothing'],
             'carefree': ['carefree', 'cheerful', 'playful', 'joyful', 'bouncy'],
             'celebratory': ['celebratory', 'joyful', 'cheerful', 'energetic', 'bouncy'],
             'confident': ['confident', 'powerful', 'energetic', 'dynamic', 'positive'],
             'optimistic': ['optimistic', 'positive', 'cheerful', 'uplifting', 'energetic'],
             'cheerful': ['cheerful', 'joyful', 'bouncy', 'playful', 'energetic'],
             'uplifting': ['uplifting', 'positive', 'energetic', 'cheerful', 'encouraging'],
             'positive': ['positive', 'cheerful', 'optimistic', 'uplifting', 'energetic'],
             'tense': ['tense', 'dramatic', 'intense', 'mysterious', 'haunting'],
             'haunting': ['haunting', 'mysterious', 'dark', 'ethereal', 'atmospheric'],
             'soothing': ['soothing', 'peaceful', 'gentle', 'relaxing', 'calm'],
             'intimate': ['intimate', 'romantic', 'gentle', 'emotional', 'passionate'],
             'elegant': ['elegant', 'sophisticated', 'stylish', 'smooth', 'cool'],
             'sophisticated': ['sophisticated', 'elegant', 'stylish', 'smooth', 'cool'],
             'magical': ['magical', 'enchanted', 'ethereal', 'mysterious', 'dreamy']
           }
           
           // Instrument associations - map common words to actual instruments
           const instrumentAssociations: { [key: string]: string[] } = {
             'guitar': ['Acoustic Guitar', 'Electric Guitar'],
             'bass': ['Bass Guitar'],
             'piano': ['Piano', 'Electric Piano'],
             'synth': ['Synthesizer'],
             'drums': ['Drums', 'Drum Machine', 'Bass Drum', 'Snare Drum', 'Hi-Hat'],
             'violin': ['Violin'],
             'cello': ['Cello'],
             'harp': ['Harp'],
             'trumpet': ['Trumpet'],
             'sax': ['Saxophone', 'Alto Sax', 'Tenor Sax', 'Baritone Sax', 'Soprano Sax'],
             'flute': ['Flute'],
             'clarinet': ['Clarinet'],
             'organ': ['Organ', 'Hammond Organ'],
             'accordion': ['Accordion'],
             'mandolin': ['Mandolin'],
             'banjo': ['Banjo'],
             'ukulele': ['Ukulele'],
             'harmonica': ['Harmonica'],
             'vocal': ['Lead Vocals', 'Backing Vocals', 'Harmony Vocals'],
             'vocals': ['Lead Vocals', 'Backing Vocals', 'Harmony Vocals'],
             'singing': ['Lead Vocals', 'Backing Vocals', 'Harmony Vocals'],
             'rap': ['Rap'],
             'beatbox': ['Beatboxing'],
             'beatboxing': ['Beatboxing'],
             'electronic': ['Synthesizer', 'Drum Machine', 'Sampler', 'Sequencer'],
             'acoustic': ['Acoustic Guitar', 'Piano', 'Violin', 'Cello', 'Harp', 'Flute', 'Clarinet'],
             'orchestral': ['Violin', 'Viola', 'Cello', 'Double Bass', 'Trumpet', 'Trombone', 'French Horn', 'Tuba', 'Flute', 'Clarinet', 'Oboe', 'Bassoon'],
             'percussion': ['Drums', 'Congas', 'Bongos', 'Djembe', 'Tambourine', 'Triangle', 'Maracas', 'Cowbell', 'Timpani', 'Xylophone', 'Vibraphone', 'Marimba', 'Glockenspiel']
           }
           
           // Genre partial word matching
           const genrePartialMatches: { [key: string]: string[] } = {
             'jaz': ['jazz'],
             'jazz': ['jazz'],
             'jazzy': ['jazz'],
             'hip': ['hip-hop', 'hip hop'],
             'rap': ['hip-hop', 'rap'],
             'rock': ['rock'],
             'pop': ['pop'],
             'class': ['classical'],
             'elect': ['electronic'],
             'amb': ['ambient'],
             'folk': ['folk'],
             'count': ['country'],
             'blues': ['blues'],
             'regg': ['reggae'],
             'funk': ['funk'],
             'soul': ['soul', 'r&b'],
             'r&b': ['r&b', 'soul'],
             'rnb': ['r&b', 'soul'],
             'trap': ['trap'],
             'edm': ['electronic'],
             'dance': ['electronic', 'dance'],
             'orchestr': ['classical'],
             'orchest': ['classical'],
             'pian': ['classical'],
             'violin': ['classical'],
             'acoust': ['acoustic'],
             'acousti': ['acoustic']
           }
           
           // Extract words that are likely to be genres, moods, instruments, or other musical terms
           const words = lowerQuery.split(/\s+/)
           const processedWords: string[] = []
           
           words.forEach(word => {
             if (stopWords.includes(word) || word.length < 2) return
             
             // Check for mood associations
             if (moodAssociations[word]) {
               processedWords.push(...moodAssociations[word])
               return
             }
             
             // Check for instrument associations
             if (instrumentAssociations[word]) {
               processedWords.push(...instrumentAssociations[word])
               return
             }
             
             // Check for genre partial matches
             for (const [partial, matches] of Object.entries(genrePartialMatches)) {
               if (word.includes(partial) || partial.includes(word)) {
                 processedWords.push(...matches)
                 return
               }
             }
             
             // Add the original word if no associations found
             processedWords.push(word)
           })
           
           // Remove duplicates and filter out stop words again
           const uniqueTerms = [...new Set(processedWords)].filter(term => 
             !stopWords.includes(term) && 
             term.length > 2
           )
           
           console.log('Original query:', query)
           console.log('Extracted key terms:', uniqueTerms)
           return uniqueTerms.length > 0 ? uniqueTerms.join(' ') : query
         }
         
                   // First clean the query to remove natural language filler
          const cleanedQuery = cleanQuery(query)
          console.log('Original query:', query)
          console.log('Cleaned query:', cleanedQuery)
          
          // Then process the cleaned query for enhanced matching
          const processedQuery = extractKeyTerms(cleanedQuery)
          console.log('Processed query:', processedQuery)
          
          // Update search params with processed query
          searchParams.query = processedQuery
         
                   console.log('Executing Algolia search with params:', searchParams)
          
          // Execute search with naturalLanguages parameter
          const { hits, nbHits, page, nbPages } = await tracksIndex.search(processedQuery, {
            ...searchParams,
            naturalLanguages: ['en'], // Ensure natural language processing is enabled
            queryType: 'prefixAll' // Enable prefix matching for partial words
          })
          
          console.log('Algolia search completed:', { hitsCount: hits.length, totalHits: nbHits })
    
    const results = {
      tracks: hits,
      totalHits: nbHits,
      currentPage: page,
      totalPages: nbPages
    }

    console.log('Returning results to frontend:', JSON.stringify(results, null, 2))

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
