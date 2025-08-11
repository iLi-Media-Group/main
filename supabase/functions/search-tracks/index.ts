import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

// Helper function to expand search terms with synonyms - FIXED VERSION
async function expandWithSynonyms(terms: string[]): Promise<string[]> {
  if (!terms || terms.length === 0) return [];
  
  const normalized = terms.map(t => t.trim().toLowerCase()).filter(Boolean);
  const expanded = new Set(normalized);
  
  // Get synonyms for each term using improved logic
  for (const term of normalized) {
    // First, try to find direct matches (term is a main term)
    const { data: directMatches } = await supabase
      .from("search_synonyms")
      .select("term, synonyms")
      .ilike("term", `%${term}%`);
    
    if (directMatches) {
      for (const row of directMatches) {
        expanded.add(row.term.toLowerCase());
        row.synonyms.forEach((s: string) => expanded.add(s.toLowerCase()));
      }
    }
    
    // Then, try to find reverse matches (term is a synonym)
    const { data: reverseMatches } = await supabase
      .from("search_synonyms")
      .select("term, synonyms")
      .contains("synonyms", [term]);
    
    if (reverseMatches) {
      for (const row of reverseMatches) {
        expanded.add(row.term.toLowerCase());
        row.synonyms.forEach((s: string) => expanded.add(s.toLowerCase()));
      }
    }
    
    // Also check for partial matches in synonyms
    const { data: partialMatches } = await supabase
      .from("search_synonyms")
      .select("term, synonyms")
      .or(`synonyms.cs.{${term}}`);
    
    if (partialMatches) {
      for (const row of partialMatches) {
        expanded.add(row.term.toLowerCase());
        row.synonyms.forEach((s: string) => expanded.add(s.toLowerCase()));
      }
    }
  }
  
  return Array.from(expanded);
}

// Helper function to calculate relevance score with fuzzy matching
function calculateRelevanceScore(track: any, searchTerms: string[], serviceParams?: { subgenres?: string[], instruments?: string[], usageTypes?: string[] }): number {
  let score = 0;
  const titleLower = track.title?.toLowerCase() || '';
  const artistLower = track.artist?.toLowerCase() || '';
  const genresLower = track.genres?.toLowerCase() || '';
  const subGenresLower = track.sub_genres?.toLowerCase() || '';
  const instrumentsLower = track.instruments?.toLowerCase() || '';
  
  // Extract media types from the new structure
  const trackMediaTypes = track.track_media_types || [];
  const mediaTypeNames = trackMediaTypes
    .map((tmt: any) => tmt.media_types?.name)
    .filter(Boolean)
    .join(' ').toLowerCase();
  
  // Also extract full names for hierarchical matching
  const mediaTypeFullNames = trackMediaTypes
    .map((tmt: any) => {
      const mediaType = tmt.media_types;
      if (!mediaType) return null;
      
      // If it has a parent, construct the full name
      if (mediaType.parent_id) {
        // We need to get the parent name, but for now we'll use the name
        // The full name will be constructed in the database function
        return mediaType.name;
      }
      return mediaType.name;
    })
    .filter(Boolean)
    .join(' ').toLowerCase();
  
  for (const term of searchTerms) {
    const termLower = term.toLowerCase();
    
    // Exact matches (highest priority)
    if (titleLower === termLower) score += 10;
    if (artistLower === termLower) score += 8;
    if (genresLower === termLower) score += 6;
    
    // Partial matches (medium priority)
    if (titleLower.includes(termLower)) score += 5;
    if (artistLower.includes(termLower)) score += 4;
    if (genresLower.includes(termLower)) score += 3;
    
    // Service-specific scoring
    if (serviceParams?.subgenres?.length && subGenresLower.includes(termLower)) score += 4;
    if (serviceParams?.instruments?.length && instrumentsLower.includes(termLower)) score += 3;
    if (serviceParams?.usageTypes?.length && (mediaTypeNames.includes(termLower) || mediaTypeFullNames.includes(termLower))) score += 3;
    
    // Fuzzy matches (lower priority) - using simple similarity
    const titleSimilarity = calculateSimilarity(titleLower, termLower);
    const artistSimilarity = calculateSimilarity(artistLower, termLower);
    
    if (titleSimilarity > 0.3) score += titleSimilarity * 2;
    if (artistSimilarity > 0.3) score += artistSimilarity * 1.5;
  }
  
  // Additional scoring for media type filters
  if (serviceParams?.usageTypes?.length) {
    const selectedMediaTypes = serviceParams.usageTypes.map((t: string) => t.toLowerCase());
    const trackMediaTypeNames = trackMediaTypes
      .map((tmt: any) => tmt.media_types?.name?.toLowerCase())
      .filter(Boolean);
    
    // Also check full names for hierarchical matching
    const trackMediaTypeFullNames = trackMediaTypes
      .map((tmt: any) => {
        const mediaType = tmt.media_types;
        if (!mediaType) return null;
        
        // For now, we'll use the name, but this should be the full_name from the database
        return mediaType.name?.toLowerCase();
      })
      .filter(Boolean);
    
    // Check if any of the selected media types match the track's media types
    const matchingMediaTypes = selectedMediaTypes.filter(selected => 
      trackMediaTypeNames.some(trackType => trackType.includes(selected) || selected.includes(trackType)) ||
      trackMediaTypeFullNames.some(trackType => trackType.includes(selected) || selected.includes(trackType))
    );
    
    if (matchingMediaTypes.length > 0) {
      score += matchingMediaTypes.length * 5; // Bonus points for each matching media type
    }
  }
  
  return score;
}

// Simple similarity calculation (trigram-like)
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1.includes(word2) || word2.includes(word1)) {
        matches++;
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    console.log('Search function called');
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const { 
      query = '', 
      genres = [], 
      subgenres = [], 
      moods = [], 
      instruments = [],
      usageTypes = [],
      limit = 40 
    } = body;

    console.log('Parsed parameters:', { query, genres, subgenres, moods, instruments, usageTypes, limit });

    // Parse search terms
    const searchTerms = query.toLowerCase().split(/\s+/).map(t => t.trim()).filter(Boolean);
    
    // Expand terms with synonyms using the improved function
    const expandedTerms = await expandWithSynonyms(searchTerms);
    const allSearchTerms = [...new Set([...searchTerms, ...expandedTerms])];
    
    console.log('Original terms:', searchTerms);
    console.log('Expanded terms:', expandedTerms);
    console.log('All search terms:', allSearchTerms);

    // Build search query with fuzzy matching
    let searchQuery = supabase.from("tracks").select(`
      *,
      track_media_types (
        media_type_id,
        media_types (
          id,
          name,
          description,
          category,
          parent_id,
          is_parent,
          display_order
        )
      )
    `);
    
    if (allSearchTerms.length > 0) {
      // Create conditions for exact, partial, and fuzzy matching
      const conditions = [];
      
      for (const term of allSearchTerms) {
        // Exact matches
        conditions.push(`title.ilike.${term}`);
        conditions.push(`artist.ilike.${term}`);
        conditions.push(`genres.ilike.${term}`);
        
        // Partial matches
        conditions.push(`title.ilike.%${term}%`);
        conditions.push(`artist.ilike.%${term}%`);
        conditions.push(`genres.ilike.%${term}%`);
      }
      
      // Add service-specific search conditions
      if (subgenres && subgenres.length > 0) {
        for (const subgenre of subgenres) {
          conditions.push(`sub_genres.ilike.%${subgenre}%`);
        }
      }
      
      if (instruments && instruments.length > 0) {
        for (const instrument of instruments) {
          conditions.push(`instruments.ilike.%${instrument}%`);
        }
      }
      
      if (usageTypes && usageTypes.length > 0) {
        // For media types, we need to check the track_media_types relationship
        // This will be handled in the relevance scoring function
        console.log('Media types filter applied:', usageTypes);
      }
      
      searchQuery = searchQuery.or(conditions.join(','));
    }

    // Execute search
    const { data: results, error: searchError } = await searchQuery.limit(limit * 2); // Get more results for better ranking
    
    if (searchError) {
      console.error('Search error:', searchError);
      throw searchError;
    }

    console.log('Raw search results count:', results?.length || 0);

    // Calculate relevance scores with fuzzy matching
    const scoredResults = (results || []).map(track => ({
      ...track,
      relevance: calculateRelevanceScore(track, allSearchTerms, { subgenres, instruments, usageTypes })
    }));

    // Filter results based on media types if specified
    let filteredResults = scoredResults;
    if (usageTypes && usageTypes.length > 0) {
      filteredResults = scoredResults.filter(track => {
        const trackMediaTypes = track.track_media_types || [];
        const trackMediaTypeNames = trackMediaTypes
          .map((tmt: any) => tmt.media_types?.name?.toLowerCase())
          .filter(Boolean);
        
        // Also check full names for hierarchical matching
        const trackMediaTypeFullNames = trackMediaTypes
          .map((tmt: any) => {
            const mediaType = tmt.media_types;
            if (!mediaType) return null;
            
            // For now, we'll use the name, but this should be the full_name from the database
            return mediaType.name?.toLowerCase();
          })
          .filter(Boolean);
        
        const selectedMediaTypes = usageTypes.map((t: string) => t.toLowerCase());
        
        // Check if any of the selected media types match the track's media types
        return selectedMediaTypes.some(selected => 
          trackMediaTypeNames.some(trackType => 
            trackType.includes(selected) || selected.includes(trackType)
          ) ||
          trackMediaTypeFullNames.some(trackType => 
            trackType.includes(selected) || selected.includes(trackType)
          )
        );
      });
    }

    // Sort by relevance score (highest first)
    filteredResults.sort((a, b) => b.relevance - a.relevance);

    // Take top results
    const finalResults = filteredResults.slice(0, limit);

    console.log('Final results count:', finalResults.length);

    return new Response(
      JSON.stringify({
        ok: true,
        tracks: finalResults,
        totalResults: finalResults.length,
        searchTerms: allSearchTerms,
        originalTerms: searchTerms,
        expandedTerms: expandedTerms
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );

  } catch (error) {
    console.error('Search function error:', error);
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Search failed',
        tracks: [],
        totalResults: 0
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
});
